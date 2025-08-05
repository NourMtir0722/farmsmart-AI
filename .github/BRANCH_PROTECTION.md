# Branch Protection Rules for FarmSmart AI

This document outlines the branch protection rules and development workflow that maximize CodeRabbit's benefits for the FarmSmart AI project.

## 🛡️ Branch Protection Rules

### Main Branch Protection

The `main` branch is protected with the following rules to ensure code quality and security:

#### Required Status Checks
- [ ] **TypeScript Compilation** - Must pass TypeScript compilation
- [ ] **ESLint Validation** - Must pass ESLint rules
- [ ] **Build Success** - Must build successfully
- [ ] **CodeRabbit Review** - Must pass CodeRabbit automated review
- [ ] **Security Scan** - Must pass security vulnerability scan
- [ ] **Performance Check** - Must meet performance benchmarks

#### Required Reviews
- [ ] **CodeRabbit Review** - Automated review by CodeRabbit
- [ ] **Human Review** - At least one human reviewer approval
- [ ] **Security Review** - Security-focused review for sensitive changes

#### Branch Restrictions
- [ ] **No Direct Pushes** - No direct pushes to main branch
- [ ] **No Force Pushes** - Force pushes are not allowed
- [ ] **No Deletions** - Branch deletion is not allowed

## 🔄 Development Workflow

### Feature Development Process

#### 1. Create Feature Branch
```bash
# Create a new feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

#### 2. Development Guidelines
- Follow the commit message conventions
- Write meaningful commit messages
- Keep commits atomic and focused
- Test your changes thoroughly

#### 3. Pre-Push Checklist
Before pushing your branch, ensure:
- [ ] All tests pass locally
- [ ] Code follows project conventions
- [ ] No console errors
- [ ] TypeScript compilation succeeds
- [ ] ESLint passes without errors
- [ ] Build succeeds

#### 4. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a pull request using the provided template.

### Pull Request Process

#### 1. Pull Request Creation
- Use the provided PR template
- Fill out all required sections
- Include screenshots for UI changes
- Document breaking changes
- Provide comprehensive testing information

#### 2. Automated Checks
The following checks run automatically on every PR:

##### Code Quality Checks
- **TypeScript Compilation**: Ensures no TypeScript errors
- **ESLint Validation**: Ensures code follows style guidelines
- **Build Success**: Ensures the project builds successfully
- **No Console Errors**: Ensures no runtime errors

##### CodeRabbit Automated Review
- **Code Quality Review**: Checks TypeScript, React, Next.js best practices
- **Security Review**: Checks for security vulnerabilities
- **Performance Review**: Checks for performance issues
- **Accessibility Review**: Checks for accessibility compliance

##### Security Checks
- **API Key Security**: Ensures no API keys are committed
- **Input Validation**: Checks for proper input validation
- **XSS Prevention**: Checks for XSS vulnerabilities
- **Environment Variables**: Ensures proper use of environment variables

##### Performance Checks
- **Bundle Size**: Ensures bundle size is reasonable
- **Image Optimization**: Checks for proper image optimization
- **Loading Performance**: Ensures good loading performance
- **Memory Usage**: Checks for memory leaks

#### 3. Review Process

##### CodeRabbit Review
CodeRabbit automatically reviews your code based on the `.coderabbit.yml` configuration:

- **Code Quality**: TypeScript, React, Next.js best practices
- **Security**: API key security, input validation, XSS prevention
- **Performance**: Bundle size, image optimization, loading states
- **Accessibility**: WCAG compliance, keyboard navigation, screen readers
- **Theme System**: Dark mode compatibility, theme persistence
- **API Integration**: Plant.id and Google Vision API specific rules

##### Human Review
After CodeRabbit review, a human reviewer will:
- Review the overall implementation
- Check for business logic correctness
- Verify user experience considerations
- Ensure documentation is complete

##### Security Review
For security-sensitive changes:
- Review security implications
- Check for potential vulnerabilities
- Verify proper authentication/authorization
- Ensure secure API usage

#### 4. Approval Requirements
- [ ] **CodeRabbit Approval**: Automated review must pass
- [ ] **Human Review**: At least one human reviewer approval
- [ ] **Security Review**: Security review for sensitive changes
- [ ] **All Checks Pass**: All automated checks must pass

## 🚀 CodeRabbit Integration

### Automated Review Process

#### 1. CodeRabbit Configuration
The `.coderabbit.yml` file configures how CodeRabbit reviews your code:

```yaml
# Review Preferences
review:
  enabled: true
  include_files:
    - "**/*.{js,jsx,ts,tsx}"
    - "**/*.{json,yml,yaml}"
    - "**/*.{md,txt}"
    - "**/*.{css,scss}"

# Language Specifications
languages:
  typescript:
    strict_type_checking: true
    no_any: true
    prefer_interfaces: true
```

#### 2. Review Categories
CodeRabbit reviews your code in these categories:

- **Code Quality** (25% weight): TypeScript, ESLint, readability
- **Security** (25% weight): API keys, input validation, XSS
- **Performance** (20% weight): Bundle size, image optimization
- **Accessibility** (15% weight): WCAG compliance, keyboard navigation
- **User Experience** (15% weight): Responsive design, theme consistency

#### 3. Automated Checks
CodeRabbit performs these automated checks:

- **TypeScript Compilation**: Ensures no TypeScript errors
- **ESLint Validation**: Ensures code follows style guidelines
- **Build Success**: Ensures the project builds successfully
- **Theme System**: Checks dark mode compatibility
- **API Integration**: Validates Plant.id and Google Vision API usage
- **Accessibility**: Checks for WCAG compliance
- **Performance**: Monitors bundle size and loading performance

### Review Comments

#### Positive Feedback
CodeRabbit provides positive feedback for:
- Great use of TypeScript
- Excellent error handling
- Perfect accessibility implementation
- Clean and readable code
- Good performance optimization
- Proper use of Next.js features
- Excellent Tailwind implementation

#### Improvement Suggestions
CodeRabbit suggests improvements for:
- Adding error boundaries
- Improving type safety
- Adding loading states
- Accessibility improvements
- Performance optimization
- Using Next.js Image component
- Improving dark mode compatibility

## 📋 Status Check Requirements

### Required Status Checks

#### 1. TypeScript Compilation
- **Purpose**: Ensures no TypeScript errors
- **Command**: `npm run type-check`
- **Failure Action**: Fix TypeScript errors before merging

#### 2. ESLint Validation
- **Purpose**: Ensures code follows style guidelines
- **Command**: `npm run lint`
- **Failure Action**: Fix ESLint errors before merging

#### 3. Build Success
- **Purpose**: Ensures the project builds successfully
- **Command**: `npm run build`
- **Failure Action**: Fix build errors before merging

#### 4. CodeRabbit Review
- **Purpose**: Automated code review
- **Process**: CodeRabbit analyzes the code
- **Failure Action**: Address CodeRabbit review comments

#### 5. Security Scan
- **Purpose**: Checks for security vulnerabilities
- **Tool**: GitHub Security scanning
- **Failure Action**: Fix security issues before merging

#### 6. Performance Check
- **Purpose**: Ensures good performance
- **Tool**: Bundle analyzer
- **Failure Action**: Optimize performance issues

### Optional Status Checks

#### 1. Test Coverage
- **Purpose**: Ensures adequate test coverage
- **Tool**: Jest coverage
- **Action**: Improve test coverage if needed

#### 2. Accessibility Check
- **Purpose**: Ensures accessibility compliance
- **Tool**: axe-core
- **Action**: Fix accessibility issues

#### 3. Performance Benchmark
- **Purpose**: Ensures performance benchmarks are met
- **Tool**: Lighthouse CI
- **Action**: Optimize performance if needed

## 🔒 Security Requirements

### API Key Security
- [ ] No API keys committed to repository
- [ ] Environment variables used for sensitive data
- [ ] API keys documented in `.env.example`
- [ ] Secure API endpoints used

### Input Validation
- [ ] All user inputs validated
- [ ] XSS prevention implemented
- [ ] Proper encoding used
- [ ] Input length limits enforced

### Authentication & Authorization
- [ ] Proper authentication implemented
- [ ] Authorization checks in place
- [ ] Session management secure
- [ ] CSRF protection enabled

## ♿ Accessibility Requirements

### WCAG Compliance
- [ ] Semantic HTML used
- [ ] Alt text provided for images
- [ ] Keyboard navigation works
- [ ] Color contrast meets standards
- [ ] ARIA attributes used properly

### Screen Reader Support
- [ ] Screen reader compatibility tested
- [ ] Proper heading hierarchy
- [ ] Focus management implemented
- [ ] Skip links provided

## 🎨 Theme System Requirements

### Dark Mode Compatibility
- [ ] All components work in dark mode
- [ ] Color contrast maintained
- [ ] Theme toggle functionality works
- [ ] Theme persistence implemented

### Responsive Design
- [ ] Mobile-first design approach
- [ ] All screen sizes supported
- [ ] Touch interactions work
- [ ] Performance optimized for mobile

## 📊 Performance Requirements

### Bundle Size
- [ ] Bundle size under 500KB (gzipped)
- [ ] No large dependencies added
- [ ] Tree shaking implemented
- [ ] Dynamic imports used where appropriate

### Loading Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

### Image Optimization
- [ ] Next.js Image component used
- [ ] WebP/AVIF formats used
- [ ] Lazy loading implemented
- [ ] Appropriate sizes provided

## 🧪 Testing Requirements

### Unit Tests
- [ ] Component functionality tested
- [ ] API calls mocked
- [ ] Error scenarios tested
- [ ] Theme changes tested

### Integration Tests
- [ ] API integrations tested
- [ ] Data flow verified
- [ ] User interactions tested
- [ ] Responsive behavior checked

### Accessibility Tests
- [ ] Keyboard navigation tested
- [ ] Color contrast verified
- [ ] Screen reader compatibility checked
- [ ] Focus management tested

## 📚 Documentation Requirements

### Code Documentation
- [ ] Complex logic commented
- [ ] API integrations documented
- [ ] Business logic explained
- [ ] JSDoc used for functions

### README Updates
- [ ] New features documented
- [ ] Environment variables updated
- [ ] Screenshots added for UI changes
- [ ] Installation instructions updated

## 🔄 Workflow Summary

### Development Process
1. **Create Feature Branch** from main
2. **Develop Feature** following guidelines
3. **Test Thoroughly** locally
4. **Push Branch** and create PR
5. **CodeRabbit Review** runs automatically
6. **Human Review** provides feedback
7. **Address Comments** and update PR
8. **Merge** when all checks pass

### Quality Gates
- ✅ TypeScript compilation passes
- ✅ ESLint validation passes
- ✅ Build succeeds
- ✅ CodeRabbit review passes
- ✅ Security scan passes
- ✅ Performance check passes
- ✅ Human review approved
- ✅ All status checks pass

### Benefits of This Workflow
- **Automated Quality Assurance**: CodeRabbit provides consistent reviews
- **Security Focus**: Automated security scanning
- **Performance Monitoring**: Bundle size and performance checks
- **Accessibility Compliance**: Automated accessibility testing
- **Theme System Validation**: Dark mode compatibility checks
- **API Integration Validation**: Plant.id and Google Vision API specific rules

This workflow ensures that all code merged into the main branch meets the highest standards of quality, security, performance, and accessibility while maximizing the benefits of CodeRabbit's automated review system. 