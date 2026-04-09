# Contributing to Lumina OS

Thank you for your interest in contributing to Lumina OS! This document provides guidelines for contributors.

## Development Setup

1. **Prerequisites**
   - Node.js 20+
   - Git

2. **Installation**
   ```bash
   git clone <repository-url>
   cd lumina-os
   npm install
   cd server && npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   cp server/.env.example server/.env
   # Edit .env with your API keys
   ```

4. **Development**
   ```bash
   npm run dev  # Starts both frontend and backend
   ```

## Code Style

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for consistent code formatting
- **Prettier**: Automatic code formatting
- **JSDoc**: Comprehensive documentation for all functions

## Project Structure

```
lumina-os/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions
├── server/                # Backend Express API
│   ├── lib/              # AI service integrations
│   ├── routes/           # API route handlers
│   └── middleware/       # Express middleware
├── public/               # Static assets
└── dist/                 # Build output (generated)
```

## API Design

- **RESTful endpoints** with consistent error handling
- **JSON responses** with proper HTTP status codes
- **Input validation** for all endpoints
- **Comprehensive logging** for debugging

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

## Commit Guidelines

- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused on single changes

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a positive community

## License

By contributing, you agree that your contributions will be licensed under the MIT License.