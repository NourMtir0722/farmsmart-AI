# Contributing to FarmSmart AI

Thank you for your interest in contributing to FarmSmart AI! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/farmsmart-AI.git
   cd farmsmart-AI
   ```

2. **Set up your development environment**
   ```bash
   npm install
   cp env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**
   - Follow the coding standards below
   - Write tests for new functionality
   - Update documentation as needed

5. **Test your changes**
   ```bash
   npm run lint
   npm run build
   npm run dev
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

7. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📋 Development Workflow

### Branch Naming Convention
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `style/` - Code style changes
- `refactor/` - Code refactoring
- `test/` - Test additions
- `chore/` - Maintenance tasks
- `perf/` - Performance improvements
- `security/` - Security fixes
- `revert/` - Revert previous commits

### Commit Message Conventions

We follow the **Conventional Commits** specification for commit messages. This ensures consistency and enables automated tools to generate changelogs and version numbers.

#### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

#### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | A new feature | `feat(auth): add user authentication system` |
| `fix` | A bug fix | `fix(api): handle plant scan API errors gracefully` |
| `docs` | Documentation changes | `docs(readme): update installation instructions` |
| `style` | Code style changes (formatting, missing semicolons, etc.) | `style(components): format code with prettier` |
| `refactor` | Code refactoring (no functional changes) | `refactor(theme): extract theme logic into custom hook` |
| `perf` | Performance improvements | `perf(images): optimize image loading with Next.js Image` |
| `test` | Adding or updating tests | `test(api): add unit tests for plant identification` |
| `chore` | Maintenance tasks | `chore(deps): update dependencies to latest versions` |
| `security` | Security fixes | `security(api): implement CSRF protection` |
| `revert` | Revert previous commits | `revert: revert "feat: add new feature"` |

#### Commit Scopes

Use scopes to indicate which part of the codebase is affected:

| Scope | Description | Example |
|-------|-------------|---------|
| `auth` | Authentication related | `feat(auth): add OAuth integration` |
| `api` | API routes and endpoints | `fix(api): handle rate limiting errors` |
| `ui` | User interface components | `style(ui): improve button styling` |
| `theme` | Theme system | `feat(theme): add dark mode toggle` |
| `docs` | Documentation | `docs(api): add API endpoint documentation` |
| `deps` | Dependencies | `chore(deps): update React to v19` |
| `ci` | Continuous integration | `chore(ci): add GitHub Actions workflow` |
| `test` | Testing | `test(components): add accessibility tests` |

#### Commit Message Examples

**Feature Commits:**
```bash
feat(theme): add dark mode toggle to settings page
feat(api): implement plant identification with Plant.id API
feat(ui): add responsive dashboard with statistics cards
feat(auth): add user authentication with NextAuth.js
```

**Bug Fix Commits:**
```bash
fix(api): handle plant scan API errors gracefully
fix(theme): resolve hydration mismatch in theme context
fix(ui): fix mobile navigation menu not closing
fix(performance): optimize image loading for better performance
```

**Documentation Commits:**
```bash
docs(readme): update installation and setup instructions
docs(api): add comprehensive API documentation
docs(contributing): add commit message conventions
docs(deployment): add Vercel deployment guide
```

**Style Commits:**
```bash
style(components): format code with prettier
style(theme): improve dark mode color contrast
style(ui): align button spacing consistently
style(layout): improve responsive design breakpoints
```

**Refactor Commits:**
```bash
refactor(theme): extract theme logic into custom hook
refactor(api): separate API logic into service layer
refactor(components): split large component into smaller ones
refactor(utils): optimize utility functions for better performance
```

**Performance Commits:**
```bash
perf(images): optimize image loading with Next.js Image
perf(bundle): reduce bundle size by removing unused dependencies
perf(api): implement caching for plant identification results
perf(ui): optimize re-renders with React.memo
```

**Test Commits:**
```bash
test(api): add unit tests for plant identification API
test(components): add accessibility tests for theme toggle
test(integration): add end-to-end tests for plant scanning
test(performance): add performance benchmarks
```

**Chore Commits:**
```bash
chore(deps): update dependencies to latest versions
chore(ci): add GitHub Actions for automated testing
chore(env): update environment variable documentation
chore(build): optimize build configuration
```

**Security Commits:**
```bash
security(api): implement rate limiting for API endpoints
security(auth): add CSRF protection to authentication
security(input): validate and sanitize user inputs
security(env): ensure API keys are properly secured
```

#### Commit Message Best Practices

1. **Use Imperative Mood**
   - ✅ `feat: add dark mode toggle`
   - ❌ `feat: added dark mode toggle`

2. **Keep Description Under 72 Characters**
   - ✅ `feat(theme): add dark mode toggle`
   - ❌ `feat(theme): add comprehensive dark mode toggle with persistence and system preference detection`

3. **Use Lowercase**
   - ✅ `feat(api): add plant identification`
   - ❌ `feat(API): add plant identification`

4. **Don't End with Period**
   - ✅ `fix(ui): resolve navigation issue`
   - ❌ `fix(ui): resolve navigation issue.`

5. **Use Present Tense**
   - ✅ `feat: add new feature`
   - ❌ `feat: added new feature`

#### Commit Message Body

For complex changes, add a detailed body:

```bash
feat(theme): add comprehensive dark mode system

- Implement dark mode toggle in settings page
- Add theme persistence with localStorage
- Support system preference detection
- Ensure all components are dark mode compatible
- Add smooth transitions between themes

Closes #123
Fixes #456
```

#### Commit Message Footer

Use footer for breaking changes and issue references:

```bash
feat(api): change plant identification response format

BREAKING CHANGE: The plant identification API now returns a different response format. 
Update your code to handle the new structure.

Closes #789
```

## 🛠️ Coding Standards

### TypeScript Guidelines
- Use TypeScript for all new code
- Avoid `any` type unless absolutely necessary
- Define proper interfaces for API responses
- Use strict type checking
- Prefer interfaces over type aliases for objects

### React Guidelines
- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries
- Use proper prop types
- Avoid unnecessary re-renders

### Component Structure
```tsx
'use client';

import { useState, useEffect } from 'react';
import { ComponentProps } from './types';

interface ComponentProps {
  // Define props interface
}

export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### Styling Guidelines
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Ensure dark mode compatibility
- Use semantic HTML elements
- Maintain consistent spacing and colors

### API Integration Guidelines
- Use proper error handling
- Implement loading states
- Validate API responses
- Use TypeScript interfaces for API types
- Handle network errors gracefully

## 🧪 Testing Guidelines

### Manual Testing Checklist
- [ ] Test on desktop browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Test dark and light themes
- [ ] Test all affected pages
- [ ] Verify API integrations work
- [ ] Check for console errors
- [ ] Test accessibility features

### Automated Testing
- [ ] TypeScript compilation passes
- [ ] ESLint validation passes
- [ ] Build succeeds without errors
- [ ] No new console errors introduced

## 🔒 Security Guidelines

### API Keys and Secrets
- Never commit API keys or secrets
- Use environment variables for sensitive data
- Update `.env.example` with new variables
- Document required environment variables

### Input Validation
- Validate all user inputs
- Sanitize data before rendering
- Prevent XSS attacks
- Use proper encoding

## ♿ Accessibility Guidelines

### General Accessibility
- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast

### Forms and Interactive Elements
- Include proper labels
- Add error messages
- Use ARIA attributes where needed
- Test form validation
- Ensure focus management

## 🎨 Theme System Guidelines

### Dark Mode Compatibility
- Test all components in both themes
- Use Tailwind `dark:` classes
- Ensure proper color contrast
- Test theme toggle functionality

### Theme Implementation
```tsx
// Use Tailwind classes for theming
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* Component content */}
</div>
```

## 📚 Documentation Guidelines

### Code Comments
- Add comments for complex logic
- Document API integrations
- Explain business logic
- Use JSDoc for functions

### README Updates
- Update README.md for new features
- Document new environment variables
- Add screenshots for UI changes
- Update installation instructions

## 🔧 Environment Setup

### Required Environment Variables
```env
# Plant.id API Configuration
PLANT_ID_API_KEY=your_plant_id_api_key_here

# Google Vision API (Optional)
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# Environment
NODE_ENV=development
```

### Getting API Keys
1. **Plant.id API**: Visit [Plant.id](https://web.plant.id/api-access-request)
2. **Google Vision API**: Set up in [Google Cloud Console](https://console.cloud.google.com/)

## 🚀 Performance Guidelines

### Optimization Best Practices
- Optimize images using Next.js Image component
- Implement proper loading states
- Use dynamic imports for large components
- Monitor bundle size
- Implement caching strategies

### Performance Checklist
- [ ] Images are optimized
- [ ] Loading states are implemented
- [ ] Bundle size is reasonable
- [ ] No unnecessary re-renders
- [ ] API calls are optimized

## 🐛 Bug Reports

### Reporting Bugs
When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and device information
- Console errors (if any)
- Screenshots (if applicable)

### Bug Report Template
```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile]
- Theme: [Light/Dark]

## Additional Information
[Any other relevant information]
```

## 💡 Feature Requests

### Requesting Features
When requesting features, please include:
- Clear description of the feature
- Use case and benefits
- Mockups or wireframes (if applicable)
- Technical considerations

## 📞 Getting Help

### Questions and Support
- Open an issue for questions
- Use GitHub Discussions for general topics
- Check existing issues and PRs
- Review the documentation

### Code Review Process
- All PRs require review
- Address review comments promptly
- Be open to feedback and suggestions
- Maintain a positive and collaborative attitude

## 📄 License

By contributing to FarmSmart AI, you agree that your contributions will be licensed under the MIT License.

## 🙏 Acknowledgments

Thank you for contributing to FarmSmart AI! Your contributions help make farming smarter with AI technology.

---

**Remember**: The goal is to make farming more efficient and sustainable through AI technology. Every contribution, no matter how small, helps achieve this mission! 🌱 