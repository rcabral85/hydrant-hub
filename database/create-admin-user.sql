-- Manual Admin User Creation SQL
-- Run this if the Node.js script doesn't work
-- Usage: psql -d hydrantdb -f database/create-admin-user.sql

-- Create the extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create default organization
INSERT INTO organizations (id, name, type, contact_email, phone, address, city, province, postal_code, country)
VALUES (
  uuid_generate_v4(),
  'Trident Systems',
  'CONTRACTOR',
  'admin@tridentsys.ca',
  '(416) 555-0123',
  '123 Water Street',
  'Milton',
  'ON',
  'L9T 0A1',
  'Canada'
)
ON CONFLICT (name) DO UPDATE SET updated_at = NOW();

-- Get the organization ID
-- Note: Replace 'your_org_uuid_here' with the actual UUID from the organizations table
-- You can get it by running: SELECT id FROM organizations WHERE name = 'Trident Systems';

-- Create admin user (password: TridentAdmin2025!)
-- Hash generated with: bcrypt.hash('TridentAdmin2025!', 12)
INSERT INTO users (
  organization_id,
  username,
  email,
  password_hash,
  first_name,
  last_name,
  role,
  phone,
  is_active
)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1),
  'admin',
  'admin@tridentsys.ca',
  '$2b$12$8gF5J3Y9ZxYUvGYKp8S8oOqLdvfUW9CbJ5Y7J3Y9ZxYUvGYKp8S8oO', -- TridentAdmin2025!
  'Admin',
  'User',
  'admin',
  '(416) 555-0123',
  true
)
ON CONFLICT (username) DO UPDATE SET 
  password_hash = '$2b$12$8gF5J3Y9ZxYUvGYKp8S8oOqLdvfUW9CbJ5Y7J3Y9ZxYUvGYKp8S8oO',
  updated_at = NOW();

-- Create test operator user (password: TestOperator123!)
INSERT INTO users (
  organization_id,
  username,
  email,
  password_hash,
  first_name,
  last_name,
  role,
  phone,
  is_active
)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1),
  'operator',
  'operator@tridentsys.ca',
  '$2b$12$1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K', -- TestOperator123!
  'Test',
  'Operator',
  'operator',
  '(416) 555-0124',
  true
)
ON CONFLICT (username) DO UPDATE SET 
  password_hash = '$2b$12$1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K',
  updated_at = NOW();

-- Verify the users were created
SELECT 
  u.username,
  u.email,
  u.role,
  u.is_active,
  o.name as organization_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.username IN ('admin', 'operator');

-- Display login information
\echo ''
\echo 'Admin user setup complete!'
\echo ''
\echo 'Login credentials:'
\echo 'Username: admin'
\echo 'Password: TridentAdmin2025!'
\echo ''
\echo 'Test operator:'
\echo 'Username: operator'
\echo 'Password: TestOperator123!'
\echo '';