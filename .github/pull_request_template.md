# Pull Request Template

## 📋 Description
<!-- Provide a clear and concise description of the changes -->

## 🎯 Type of Change
<!-- Mark the appropriate option(s) with an 'x' -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style/UI update (formatting, missing semi colons, etc; no logic change)
- [ ] ♻️ Refactor (no functional changes, code improvements)
- [ ] ⚡ Performance improvements
- [ ] ✅ Test additions or updates
- [ ] 🔧 Configuration changes

## 🔗 Related Issues
<!-- Link any related issues using the format: Closes #123, Fixes #456 -->

Closes #
Fixes #

## 🧪 Testing
<!-- Describe the tests you ran and their results -->

### Manual Testing
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Tested dark mode
- [ ] Tested light mode
- [ ] Tested all affected pages
- [ ] Verified API integrations work
- [ ] Checked for console errors

### Automated Testing
- [ ] TypeScript compilation passes
- [ ] ESLint validation passes
- [ ] Build succeeds
- [ ] No new console errors

## 📸 Screenshots
<!-- Add screenshots for UI changes -->

### Before
<!-- Add screenshots of the current state -->

### After
<!-- Add screenshots of the new state -->

## 🔧 Environment Variables
<!-- List any new environment variables or changes to existing ones -->

### New Variables
```env
# Add any new environment variables here
NEW_VARIABLE=description
```

### Updated Variables
```env
# List any changes to existing variables
EXISTING_VARIABLE=updated_description
```

## 📝 Checklist
<!-- Mark items as completed -->

### Code Quality
- [ ] Code follows TypeScript best practices
- [ ] No `any` types used (unless absolutely necessary)
- [ ] Proper error handling implemented
- [ ] Code is readable and well-commented
- [ ] No console.log statements in production code
- [ ] ESLint passes without errors

### Security
- [ ] No API keys or secrets committed
- [ ] User inputs are properly validated
- [ ] Environment variables used for sensitive data
- [ ] No XSS vulnerabilities introduced

### Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized (if applicable)
- [ ] Bundle size not significantly increased
- [ ] Loading states implemented for async operations

### Accessibility
- [ ] Semantic HTML used
- [ ] Alt text provided for images
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG guidelines
- [ ] ARIA attributes added where needed

### Theme System
- [ ] Dark mode compatibility tested
- [ ] Light mode compatibility tested
- [ ] Theme toggle functionality works
- [ ] No theme-related console errors

### API Integration
- [ ] Error handling for API failures
- [ ] Loading states for API calls
- [ ] Proper TypeScript interfaces for API responses
- [ ] Rate limiting considerations (if applicable)

## 🚀 Deployment Notes
<!-- Any special considerations for deployment -->

## 📚 Documentation
<!-- Update any relevant documentation -->

- [ ] README.md updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Environment variables documented
- [ ] Code comments added for complex logic

## 🔍 Review Focus Areas
<!-- Highlight specific areas you'd like reviewers to focus on -->

## 📋 Additional Notes
<!-- Any other information that reviewers should know -->

---

**By submitting this pull request, I confirm that:**
- [ ] I have read and followed the project's contributing guidelines
- [ ] My code follows the project's coding standards
- [ ] I have tested my changes thoroughly
- [ ] I have updated documentation as needed
- [ ] My changes do not break existing functionality 