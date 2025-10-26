# Contributing to HydrantHub

Thank you for your interest in contributing to HydrantHub! This guide will help you get started.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hydrant-management.git
   cd hydrant-management
   ```
3. **Set up development environment** (see Development Setup below)
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes** with tests
6. **Submit a pull request**

## 🛠 Development Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS extension
- Git

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

### Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE hydrantdb;"
psql -U postgres -d hydrantdb -c "CREATE EXTENSION postgis;"

# Load schema
psql -U postgres -d hydrantdb -f database/schema.sql
```

### Verify Setup
- Backend: http://localhost:5000/api/health
- Deep health check: http://localhost:5000/api/health/deep

## 📋 Development Guidelines

### Code Style
- Use **ESLint** for JavaScript linting
- Follow **Prettier** formatting
- Use **meaningful variable names**
- Add **JSDoc comments** for functions
- Keep functions **small and focused**

### Commit Messages
Use [Conventional Commits](https://conventionalcommits.org/):

```
feat: add flow test calculation endpoint
fix: correct NFPA 291 formula implementation
docs: update API documentation
test: add unit tests for calculations
refactor: extract database queries to service layer
```

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation only
- `refactor/code-improvement` - Code refactoring
- `test/test-addition` - Adding tests

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**:
   ```bash
   npm test
   npm run lint
   ```
4. **Update the README.md** with new features/changes
5. **Create a detailed PR description**:
   - What changes were made?
   - Why were they made?
   - How to test the changes?
   - Screenshots (if UI changes)

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or marked as such)
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Run specific test file
npm test calculations.test.js

# Run with coverage
npm run test:coverage
```

### Writing Tests
- Use **Jest** for testing
- Test files should end with `.test.js`
- Place tests in `__tests__` directory or next to source files
- Write tests for:
  - NFPA 291 calculations
  - API endpoints
  - Database operations
  - Validation logic

### Test Example
```javascript
const { calculateOutletFlow } = require('../services/calculations');

describe('NFPA 291 Calculations', () => {
  test('should calculate outlet flow correctly', () => {
    const flow = calculateOutletFlow(50, 2.5, 0.90);
    expect(flow).toBeCloseTo(1188.38, 1);
  });
});
```

## 📚 API Development

### Adding New Endpoints
1. Create route in `/backend/routes/`
2. Add validation with **Joi**
3. Include proper error handling
4. Add **JSDoc comments**
5. Update API documentation

### Validation Example
```javascript
const schema = Joi.object({
  hydrantNumber: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required()
  }).required()
});
```

### Error Handling
```javascript
try {
  // Your code here
} catch (error) {
  console.error('Operation failed:', error);
  next(error); // Pass to error middleware
}
```

## 🗄 Database Guidelines

### Migrations
- Create migration files for schema changes
- Name migrations: `YYYYMMDD_description.sql`
- Always provide rollback scripts
- Test migrations on sample data

### Queries
- Use **parameterized queries** to prevent SQL injection
- Create indexes for frequently queried columns
- Use transactions for multi-table operations
- Add proper error handling

### Example Query
```javascript
const result = await query(
  'SELECT * FROM hydrants WHERE organization_id = $1 AND status = $2',
  [organizationId, 'active']
);
```

## 🎯 Priority Areas for Contribution

### High Priority
1. **Authentication system** (JWT + bcrypt)
2. **Hydrant CRUD operations**
3. **PDF report generation**
4. **Email notifications**
5. **Mobile app (React Native)**

### Medium Priority
1. **Advanced mapping features**
2. **Inspection management**
3. **Scheduling system**
4. **Integration tests**
5. **Performance optimization**

### Documentation
1. **API documentation** (OpenAPI/Swagger)
2. **User guide**
3. **Deployment guide**
4. **Architecture diagrams**

## 🚫 What Not to Include

- Hardcoded credentials or API keys
- Large binary files (images, videos)
- Generated files (node_modules, build folders)
- Personal configuration files
- Sensitive customer data

## 🤝 Community Guidelines

### Be Respectful
- Use inclusive language
- Respect different opinions and approaches
- Provide constructive feedback
- Help newcomers get started

### Water Industry Expertise
- Share your water utility experience
- Suggest practical features for operators
- Help validate NFPA 291 compliance
- Contribute domain knowledge

### Feature Requests
Before requesting features:
1. Check existing issues/PRs
2. Describe the use case
3. Explain why it's valuable for water operators
4. Consider implementation complexity

## 📞 Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: info@tridentsys.ca for private matters

## 🏆 Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Invited to beta test new features
- Acknowledged in presentations at water industry conferences

---

**Built with ❤️ for water operators by water operators**

Thank you for helping make HydrantHub the best hydrant management platform for the water industry!
