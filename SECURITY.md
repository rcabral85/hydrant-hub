# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in HydrantHub, please email security@tridentsys.ca immediately. Do not create public GitHub issues for security vulnerabilities.

## Security Best Practices

### Environment Variables

**CRITICAL**: Never commit `.env` files to version control.

1. Copy `.env.example` to `.env`
2. Update with your actual credentials
3. Verify `.env` is in `.gitignore`
4. Rotate any exposed credentials immediately

### Production Database Credentials

If database credentials are exposed:

1. **Immediately** rotate database password in Railway/hosting platform
2. Update environment variables in deployment
3. Audit database access logs for unauthorized activity
4. Consider creating new database user with limited permissions

### JWT Secret Management

Generate secure JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Requirements**:
- Minimum 64 characters
- Cryptographically random
- Different for each environment
- Never hardcoded in source code
- Rotated periodically (every 90 days recommended)

### CORS Configuration

Only whitelist trusted domains:

```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

**Do not use** `*` in production.

### SMTP Credentials

For Gmail:
1. Use App-Specific Passwords, not account password
2. Enable 2FA on Google account
3. Limit app password permissions

For SendGrid/Mailgun:
1. Use API keys with minimum required permissions
2. Rotate keys every 90 days
3. Monitor usage for anomalies

### Database Security

1. **Never** use `postgres` superuser in application
2. Create limited-privilege user:
   ```sql
   CREATE USER hydrant_app WITH PASSWORD 'secure_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hydrant_app;
   ```
3. Use SSL/TLS for database connections
4. Enable connection pooling with limits
5. Regular backups with encryption

### API Security

1. **Rate Limiting**: Configured in backend
2. **Input Validation**: All user inputs sanitized
3. **SQL Injection**: Using parameterized queries
4. **XSS Protection**: Helmet.js enabled
5. **CSRF**: Token-based protection for state-changing operations

### Deployment Security

#### Railway
1. Use environment variables, not hardcoded secrets
2. Enable "Private Networking" for database
3. Regular security updates
4. Monitor deployment logs

#### Netlify
1. Enable HTTPS (automatic)
2. Set security headers
3. Configure Content Security Policy
4. Use environment variables for build secrets

### User Authentication

1. **Password Requirements**:
   - Minimum 8 characters
   - Must include uppercase, lowercase, number
   - No common passwords
   - Bcrypt with cost factor 12

2. **JWT Tokens**:
   - 24-hour expiration
   - Secure httpOnly cookies (future enhancement)
   - Refresh token rotation

3. **Session Management**:
   - Logout invalidates tokens
   - Concurrent session limits
   - Activity timeout

### Dependency Management

Run security audits regularly:

```bash
cd backend && npm audit
cd frontend && npm audit
```

Update dependencies:
```bash
npm audit fix
```

### Monitoring & Logging

1. **Audit Logs**: Track sensitive operations
2. **Error Logging**: Never log passwords or tokens
3. **Access Logs**: Monitor for unusual patterns
4. **Alerts**: Set up for suspicious activity

## Security Checklist for Production

- [ ] All `.env` files removed from git history
- [ ] JWT_SECRET is cryptographically random
- [ ] Database uses limited-privilege user
- [ ] CORS whitelist configured correctly
- [ ] SMTP credentials use app-specific passwords
- [ ] Rate limiting enabled
- [ ] HTTPS enforced on all endpoints
- [ ] Security headers configured (Helmet.js)
- [ ] Input validation on all endpoints
- [ ] SQL queries use parameterized statements
- [ ] Error messages don't expose sensitive info
- [ ] Dependency audit passing
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured

## Incident Response

If credentials are exposed:

1. **Immediate** (within 1 hour):
   - Rotate exposed credentials
   - Block unauthorized access
   - Review access logs

2. **Short-term** (within 24 hours):
   - Audit all related systems
   - Notify affected users if necessary
   - Document incident

3. **Long-term** (within 1 week):
   - Review security practices
   - Implement additional controls
   - Update security documentation

## Contact

- **Security Issues**: security@tridentsys.ca
- **General Support**: support@tridentsys.ca
- **GitHub Issues**: https://github.com/rcabral85/hydrant-hub/issues (non-security only)
