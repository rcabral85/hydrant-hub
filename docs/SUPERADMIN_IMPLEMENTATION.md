# Superadmin Role Protection Implementation

This document outlines the implementation of superadmin role protection for the HydrantHub admin dashboard.

## Overview

The implementation restricts access to the `/admin` route to users with the `superadmin` role. Both backend API endpoints and frontend routes are protected.

## Files Modified/Created

### Backend

1. **`backend/middleware/checkSuperadmin.js`** (NEW)
   - Middleware that checks if the authenticated user has `superadmin` role
   - Returns 403 Forbidden if user is not a superadmin
   - Returns 401 if user is not authenticated

2. **`backend/routes/admin.js`** (UPDATED)
   - Now uses both `authMiddleware` and `checkSuperadmin` middleware
   - All admin routes are protected by these middlewares
   - No changes to route handlers needed

### Frontend

1. **`frontend/src/components/ProtectedRoute.jsx`** (NEW)
   - Reusable component for protecting routes
   - Accepts `requireSuperadmin` prop for role-based protection
   - Shows loading spinner while checking authentication
   - Displays "Access Denied" message for unauthorized users
   - Redirects to login for unauthenticated users

2. **`frontend/src/App.jsx`** (UPDATED)
   - Imports the new `ProtectedRoute` component
   - Wraps `/admin` route with `<ProtectedRoute requireSuperadmin={true}>`
   - Other protected routes use `<ProtectedRoute>` without the superadmin requirement

3. **`frontend/src/components/Navigation.jsx`** (UPDATED)
   - Admin link now checks for `user.role === 'superadmin'` instead of `user.role === 'admin'`
   - Non-superadmin users will not see the Admin link in navigation

## How It Works

### Backend Protection

1. User makes request to `/api/admin/*` endpoint
2. `authMiddleware` verifies JWT token and attaches `req.user`
3. `checkSuperadmin` middleware checks if `req.user.role === 'superadmin'`
4. If not superadmin, returns 403 Forbidden error
5. If superadmin, request proceeds to route handler

### Frontend Protection

1. User navigates to `/admin` route
2. `ProtectedRoute` component checks authentication status
3. If not authenticated, redirects to `/login`
4. If authenticated but not superadmin, shows "Access Denied" page
5. If superadmin, renders the `AdminDashboard` component
6. Navigation bar only displays Admin link if `user.role === 'superadmin'`

## Database Setup

To designate a user as superadmin, update their role in the database:

```sql
-- Find your user
SELECT id, username, email, role FROM users WHERE username = 'your_username';

-- Promote to superadmin
UPDATE users SET role = 'superadmin' WHERE username = 'your_username';

-- Verify the change
SELECT id, username, email, role FROM users WHERE username = 'your_username';
```

## Testing

### Test as Superadmin User

1. Login with superadmin account
2. You should see "Admin" link in navigation bar
3. Click Admin link - should successfully load admin dashboard
4. Admin dashboard should display users and organizations

### Test as Regular User

1. Login with non-superadmin account
2. Admin link should NOT appear in navigation bar
3. Try accessing `/admin` directly in browser
4. Should see "Access Denied" page
5. Backend API calls to `/api/admin/*` should return 403 Forbidden

### Test Backend Protection

Using curl or Postman:

```bash
# Get auth token for regular user
curl -X POST https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"password"}'

# Try to access admin endpoint with regular user token
curl -X GET https://your-backend-url/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return: {"error":"Access denied. Superadmin privileges required."}
```

## User Roles

- **superadmin**: Full system access, can view admin dashboard
- **admin**: Organization administrator (does NOT have superadmin access)
- **supervisor**: Can manage team operations
- **operator**: Can perform field operations
- **viewer**: Read-only access

## Security Notes

1. **Both backend and frontend are protected** - even if a user bypasses frontend checks, the backend will reject unauthorized requests
2. **Role is verified from the database** - the JWT token contains the role, which is validated on each request
3. **No privilege escalation** - users cannot change their own role through the API
4. **AuthContext always provides current role** - role information is refreshed when user profile is loaded

## Troubleshooting

### Admin link shows for non-superadmin
- Check that `user.role` is correctly set in AuthContext
- Verify the user's role in the database
- Clear browser cache and re-login

### Getting 403 even as superadmin
- Verify database role is exactly `'superadmin'` (case-sensitive)
- Check that JWT token includes the correct role
- Ensure `authMiddleware` runs before `checkSuperadmin`

### Access Denied page doesn't show
- Check that `ProtectedRoute` is correctly imported in `App.jsx`
- Verify `requireSuperadmin={true}` prop is set for admin route
- Ensure AuthContext is properly providing user data

## Future Enhancements

- Add more granular permissions system
- Create role management interface for superadmins
- Add audit logging for admin actions
- Implement multi-factor authentication for superadmin accounts
