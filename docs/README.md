# HydrantHub Documentation

Welcome to the HydrantHub documentation! This directory contains all project documentation organized by category.

## 📚 Documentation Structure

### 🚀 Setup & Deployment
**Location:** `docs/setup/`

- **[Local Development](setup/local-development.md)** - Set up your dev environment
- **[Environment Variables](setup/environment-variables.md)** - Configure environment settings
- **[Pre-Launch Checklist](setup/pre-launch-checklist.md)** - Production deployment checklist

### 🛠️ Development
**Location:** `docs/development/`

- **[Contributing Guide](development/contributing.md)** - How to contribute to the project
- **[Testing Guide](development/testing-guide.md)** - Testing strategies and tools

### 🐛 Fixes & Solutions
**Location:** `docs/fixes/`

Documented bug fixes and their solutions:

- **[Logout & Maintenance Fix](fixes/logout-maintenance-fix.md)** - Authentication and page fixes
- **[Maintenance Endpoints Fix](fixes/maintenance-endpoints-fix.md)** - API endpoint corrections
- **[Railway Deployment Fix](fixes/railway-deployment-fix.md)** - Deployment troubleshooting
- **[Hydrant Add Improvements](fixes/hydrant-add-improvements.md)** - UX enhancements

### 📦 Archive
**Location:** `docs/archive/`

Historical documentation kept for reference:

- Implementation guides from earlier versions
- Legacy module documentation
- Superseded by current guides or PR #31

## 🗄️ Database Documentation

**Location:** `database/`

- **`master-schema.sql`** - Current unified database schema (from PR #31)
- **`sample-hydrant-data.sql`** - Sample data for testing
- **`migrations/`** - Database migration scripts
- **`scripts/`** - Utility scripts
- **`archive/`** - Old schema files for reference

## 🎯 Quick Start

### New to the Project?
1. Read the main [README.md](../README.md) in the root
2. Follow [Local Development Setup](setup/local-development.md)
3. Configure [Environment Variables](setup/environment-variables.md)
4. Review [Contributing Guide](development/contributing.md)

### Deploying to Production?
1. Review [Pre-Launch Checklist](setup/pre-launch-checklist.md)
2. Check [Environment Variables](setup/environment-variables.md)
3. Review recent fixes in `docs/fixes/`

### Troubleshooting?
1. Check `docs/fixes/` for documented solutions
2. Search the [GitHub Issues](https://github.com/rcabral85/hydrant-hub/issues)
3. Review [PR #31](https://github.com/rcabral85/hydrant-hub/pull/31) for latest refactor details

## 📝 Documentation Standards

### When to Add Documentation

- **New features** → Add to appropriate section
- **Bug fixes** → Document in `docs/fixes/`
- **Setup changes** → Update `docs/setup/`
- **Deprecated features** → Move to `docs/archive/`

### Documentation Format

All docs use Markdown with:
- Clear headings and sections
- Code examples where applicable
- Links to related documentation
- Date and author when relevant

## 🔗 Related Resources

- **Main README:** [../README.md](../README.md)
- **PR #31 Refactor Guide:** [Complete App Refactor PR](https://github.com/rcabral85/hydrant-hub/pull/31)
- **Contributing:** [development/contributing.md](development/contributing.md)
- **License:** [../LICENSE](../LICENSE)

## 🆘 Need Help?

1. Search this documentation
2. Check [GitHub Issues](https://github.com/rcabral85/hydrant-hub/issues)
3. Review [PR discussions](https://github.com/rcabral85/hydrant-hub/pulls)
4. Contact the maintainers

---

**Last Updated:** November 17, 2025  
**Maintained by:** HydrantHub Team
