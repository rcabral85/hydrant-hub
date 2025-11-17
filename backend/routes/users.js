const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const crypto = require('crypto');

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================
// USER INVITATION SYSTEM
// ============================================

// Send invitation to new operator
router.post('/invite', requireAdmin, async (req, res) => {
  try {
    const { email, first_name, last_name, role } = req.body;
    const adminUserId = req.user.userId;

    // Validate input
    if (!email || !first_name || !last_name) {
      return res.status(400).json({ 
        error: 'Email, first name, and last name are required' 
      });
    }

    // Get admin's organization
    const adminQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [adminUserId]
    );

    if (!adminQuery.rows[0]) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    const organizationId = adminQuery.rows[0].organization_id;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id, is_active FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create temporary username
    const tempUsername = `temp_${email.split('@')[0]}_${Date.now()}`;

    // Insert user with invite token (inactive until they accept)
    const result = await db.query(`
      INSERT INTO users (
        organization_id, username, email, password_hash,
        first_name, last_name, role, is_active,
        invite_token, invite_expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, email, first_name, last_name, role, invite_token
    `, [
      organizationId,
      tempUsername,
      email,
      'PENDING_INVITATION', // Placeholder, will be set when they accept
      first_name,
      last_name,
      role || 'operator',
      false, // Not active until invitation accepted
      inviteToken,
      inviteExpiresAt
    ]);

    const newUser = result.rows[0];

    // Generate invitation link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation?token=${inviteToken}`;

    // TODO: Send email with invitation link
    // For now, return the link so admin can share it
    console.log(`Invitation link for ${email}: ${inviteLink}`);

    res.status(201).json({
      message: 'Invitation sent successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
      },
      inviteLink, // Return link for now until email is set up
    });

  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Accept invitation and complete registration
router.post('/accept-invitation', async (req, res) => {
  try {
    const { token, username, password } = req.body;

    // Validate input
    if (!token || !username || !password) {
      return res.status(400).json({ 
        error: 'Token, username, and password are required' 
      });
    }

    // Find user by invite token
    const userQuery = await db.query(
      'SELECT * FROM users WHERE invite_token = $1',
      [token]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    const user = userQuery.rows[0];

    // Check if token expired
    if (new Date(user.invite_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if username is already taken
    const usernameCheck = await db.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, user.id]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user - activate account and set credentials
    await db.query(`
      UPDATE users 
      SET 
        username = $1,
        password_hash = $2,
        is_active = true,
        invite_token = NULL,
        invite_expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [username, passwordHash, user.id]);

    res.json({
      message: 'Account activated successfully',
      user: {
        id: user.id,
        username: username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to activate account' });
  }
});

// Resend invitation
router.post('/invite/resend/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminUserId = req.user.userId;

    // Get admin's organization
    const adminQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [adminUserId]
    );

    const organizationId = adminQuery.rows[0].organization_id;

    // Get user and verify they're in same organization
    const userQuery = await db.query(
      'SELECT * FROM users WHERE id = $1 AND organization_id = $2',
      [userId, organizationId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userQuery.rows[0];

    if (user.is_active) {
      return res.status(400).json({ error: 'User is already active' });
    }

    // Generate new invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update invite token
    await db.query(`
      UPDATE users 
      SET invite_token = $1, invite_expires_at = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [inviteToken, inviteExpiresAt, userId]);

    // Generate invitation link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation?token=${inviteToken}`;

    console.log(`New invitation link for ${user.email}: ${inviteLink}`);

    res.json({
      message: 'Invitation resent successfully',
      inviteLink,
    });

  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ error: 'Failed to resend invitation' });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// Get all users in organization
router.get('/', requireAdmin, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's organization
    const userQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (!userQuery.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const organizationId = userQuery.rows[0].organization_id;

    // Get all users in organization
    const result = await db.query(`
      SELECT 
        id, username, email, first_name, last_name, phone,
        role, is_active, last_login, created_at,
        CASE WHEN invite_token IS NOT NULL THEN true ELSE false END as pending_invitation
      FROM users
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `, [organizationId]);

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.userId;

    // Get requesting user's organization
    const requestingUser = await db.query(
      'SELECT organization_id, role FROM users WHERE id = $1',
      [requestingUserId]
    );

    const organizationId = requestingUser.rows[0].organization_id;

    // Get target user (verify same organization or superadmin)
    const result = await db.query(`
      SELECT 
        id, username, email, first_name, last_name, phone,
        role, is_active, last_login, created_at
      FROM users
      WHERE id = $1 AND organization_id = $2
    `, [id, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, role, is_active } = req.body;
    const adminUserId = req.user.userId;

    // Get admin's organization
    const adminQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [adminUserId]
    );

    const organizationId = adminQuery.rows[0].organization_id;

    // Verify target user is in same organization
    const targetUser = await db.query(
      'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
      [id, organizationId]
    );

    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    const result = await db.query(`
      UPDATE users
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        role = COALESCE($4, role),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, username, email, first_name, last_name, phone, role, is_active
    `, [first_name, last_name, phone, role, is_active, id]);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0],
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Deactivate user
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.userId;

    // Prevent self-deletion
    if (parseInt(id) === parseInt(adminUserId)) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    // Get admin's organization
    const adminQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [adminUserId]
    );

    const organizationId = adminQuery.rows[0].organization_id;

    // Deactivate user (soft delete)
    const result = await db.query(`
      UPDATE users
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND organization_id = $2
      RETURNING id, email
    `, [id, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deactivated successfully',
      user: result.rows[0],
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

module.exports = router;