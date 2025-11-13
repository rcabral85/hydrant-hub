# Contributing to HydrantHub 🔥💧

Thank you for your interest in contributing to HydrantHub! We welcome contributions from the water utility and fire safety community.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment. We're here to improve water utility operations together.

## How to Contribute

### Reporting Bugs 🐛

1. **Check existing issues** first to avoid duplicates
2. **Use the bug report template** when creating a new issue
3. **Provide details**:
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots if applicable
   - Environment (OS, browser, Node version)

### Suggesting Features 💡

1. **Search existing feature requests** to see if it's already been suggested
2. **Use the feature request template**
3. **Explain the use case** - how would this help water utilities?
4. **Describe the solution** you'd like to see
5. **Consider alternatives** you've thought about

### Code Contributions 💻

#### Development Setup

```bash
# Fork and clone the repo
git clone https://github.com/YOUR-USERNAME/hydrant-hub.git
cd hydrant-hub

# Option 1: Docker (recommended for quick setup)
docker-compose up

# Option 2: Manual setup
# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev

# Install frontend dependencies (in new terminal)
cd frontend
npm install
npm start
```

#### Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following our coding standards:
   - Write clean, readable code
   - Add comments for complex logic
   - Follow existing code style
   - Update documentation if needed

3. **Test your changes**:
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Frontend tests
   cd frontend
   npm test
   ```

4. **Commit your changes** with clear messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   # or
   git commit -m "Fix: description of what you fixed"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**:
   - Use a clear title describing the change
   - Reference any related issues
   - Describe what you changed and why
   - Add screenshots for UI changes

#### PR Review Process

1. Automated checks will run (linting, tests, build)
2. A maintainer will review your code
3. Address any feedback or requested changes
4. Once approved, your PR will be merged!

## Coding Standards

### JavaScript/React
- Use ES6+ features
- Use functional components with hooks (React)
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Database
- Use parameterized queries (prevent SQL injection)
- Add proper indexes for performance
- Document schema changes

### API Design
- Follow RESTful conventions
- Use proper HTTP status codes
- Document endpoints in API docs
- Validate all inputs

### Git Commit Messages

Follow this format:
```
Type: Short description (50 chars max)

Optional longer description explaining the change.

Closes #issue-number
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Project Structure

```
hydrant-hub/
├── backend/           # Node.js/Express API
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth, validation, etc.
│   ├── config/        # Configuration files
│   └── services/      # Business logic
├── frontend/          # React application
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── utils/      # Utility functions
│   │   └── hooks/      # Custom React hooks
├── database/          # SQL schemas and migrations
└── docs/              # Documentation
```

## Testing Guidelines

- Write unit tests for business logic
- Write integration tests for API endpoints
- Test edge cases and error conditions
- Aim for >80% code coverage on new features

## Documentation

- Update README.md if you change setup process
- Add JSDoc comments to functions
- Update API documentation for endpoint changes
- Include inline comments for complex logic

## Getting Help

- **Questions?** Open a discussion in GitHub Discussions
- **Bug or feature?** Create an issue
- **Need guidance?** Reach out in your PR comments
- **Email:** support@tridentsys.ca

## Recognition

All contributors will be acknowledged in our README and release notes. Thank you for helping improve water utility operations!

---

**Remember:** We're all here to make hydrant testing easier for water utilities. Let's build something great together! 🚀