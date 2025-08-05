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

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Test additions
- `chore` - Maintenance tasks

**Examples:**
```
feat(theme): add dark mode toggle to settings page
fix(api): handle plant scan API errors gracefully
docs(readme): update installation instructions
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