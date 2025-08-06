# Pull Request Template

## 📋 Feature Description
<!-- Provide a clear and concise description of the changes -->

### 🎯 What does this PR do?
<!-- Explain the main purpose and functionality added/modified -->

### 🔗 Related Issues
<!-- Link any related issues using the format: Closes #123, Fixes #456 -->

Closes #
Fixes #

### 🎯 Type of Change
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
- [ ] 🔒 Security improvements
- [ ] ♿ Accessibility improvements

## 🧪 Testing Checklist

### ✅ Manual Testing
<!-- Mark items as completed -->

- [ ] **Desktop Testing**
  - [ ] Tested on Chrome (latest)
  - [ ] Tested on Firefox (latest)
  - [ ] Tested on Safari (latest)
  - [ ] Tested on Edge (latest)

- [ ] **Mobile Testing**
  - [ ] Tested on iOS Safari
  - [ ] Tested on Android Chrome
  - [ ] Tested responsive design on various screen sizes
  - [ ] Verified touch interactions work properly

- [ ] **Theme System Testing**
  - [ ] Tested light mode functionality
  - [ ] Tested dark mode functionality
  - [ ] Verified theme toggle works correctly
  - [ ] Checked color contrast in both themes
  - [ ] Tested theme persistence across page reloads

- [ ] **Feature-Specific Testing**
  - [ ] Tested all affected pages/routes
  - [ ] Verified API integrations work correctly
  - [ ] Tested error handling scenarios
  - [ ] Verified loading states work properly
  - [ ] Tested form validations (if applicable)
  - [ ] Verified accessibility features

- [ ] **Cross-Browser Compatibility**
  - [ ] No console errors in any browser
  - [ ] Consistent behavior across browsers
  - [ ] Proper fallbacks for unsupported features

### ✅ Automated Testing
<!-- Mark items as completed -->

- [ ] **Code Quality Checks**
  - [ ] TypeScript compilation passes
  - [ ] ESLint validation passes
  - [ ] No TypeScript errors
  - [ ] No ESLint warnings/errors
  - [ ] Code follows project conventions

- [ ] **Build & Performance**
  - [ ] Build succeeds without errors
  - [ ] No new console errors introduced
  - [ ] Bundle size is reasonable
  - [ ] Performance metrics are acceptable
  - [ ] No memory leaks detected

- [ ] **Security Checks**
  - [ ] No API keys or secrets committed
  - [ ] Input validation implemented
  - [ ] XSS prevention measures in place
  - [ ] Environment variables used properly

### ✅ CodeRabbit Review
<!-- CodeRabbit will automatically review based on .coderabbit.yml configuration -->

- [ ] **Code Quality Review**
  - [ ] TypeScript best practices followed
  - [ ] React best practices implemented
  - [ ] Next.js 14+ patterns used correctly
  - [ ] Tailwind CSS conventions followed

- [ ] **Security Review**
  - [ ] API key security maintained
  - [ ] Input validation implemented
  - [ ] No security vulnerabilities introduced

- [ ] **Performance Review**
  - [ ] No unnecessary re-renders
  - [ ] Images optimized properly
  - [ ] Bundle size optimized
  - [ ] Loading states implemented

- [ ] **Accessibility Review**
  - [ ] WCAG compliance maintained
  - [ ] Keyboard navigation works
  - [ ] Screen reader compatibility
  - [ ] Color contrast meets standards

## 📸 Screenshots
<!-- Add screenshots for UI changes -->

### 🖥️ Desktop Screenshots
<!-- Add screenshots of desktop view -->

#### Before
<!-- Add screenshots of the current state on desktop -->

#### After
<!-- Add screenshots of the new state on desktop -->

### 📱 Mobile Screenshots
<!-- Add screenshots of mobile view -->

#### Before
<!-- Add screenshots of the current state on mobile -->

#### After
<!-- Add screenshots of the new state on mobile -->

### 🌙 Dark Mode Screenshots
<!-- Add screenshots for dark mode changes -->

#### Before
<!-- Add screenshots of the current dark mode state -->

#### After
<!-- Add screenshots of the new dark mode state -->

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

## 💥 Breaking Changes
<!-- Document any breaking changes -->

### Breaking Changes
<!-- List any breaking changes that will affect existing functionality -->

- **Change 1**: Description of what changed and how it affects users
- **Change 2**: Description of what changed and how it affects users

### Migration Guide
<!-- Provide steps for users to migrate from old to new functionality -->

1. **Step 1**: Description of migration step
2. **Step 2**: Description of migration step
3. **Step 3**: Description of migration step

## 🚀 Performance Impact
<!-- Document performance implications -->

### Performance Improvements
<!-- List any performance improvements -->

- **Improvement 1**: Description of performance improvement
- **Improvement 2**: Description of performance improvement

### Performance Considerations
<!-- List any performance considerations or trade-offs -->

- **Consideration 1**: Description of performance consideration
- **Consideration 2**: Description of performance consideration

## ♿ Accessibility Impact
<!-- Document accessibility implications -->

### Accessibility Improvements
<!-- List any accessibility improvements -->

- **Improvement 1**: Description of accessibility improvement
- **Improvement 2**: Description of accessibility improvement

### Accessibility Considerations
<!-- List any accessibility considerations -->

- **Consideration 1**: Description of accessibility consideration
- **Consideration 2**: Description of accessibility consideration

## 🔒 Security Impact
<!-- Document security implications -->

### Security Improvements
<!-- List any security improvements -->

- **Improvement 1**: Description of security improvement
- **Improvement 2**: Description of security improvement

### Security Considerations
<!-- List any security considerations -->

- **Consideration 1**: Description of security consideration
- **Consideration 2**: Description of security consideration

## 📚 Documentation Updates
<!-- Document any documentation changes -->

### Documentation Added
<!-- List any new documentation -->

- **Documentation 1**: Description of new documentation
- **Documentation 2**: Description of new documentation

### Documentation Updated
<!-- List any updated documentation -->

- **Documentation 1**: Description of documentation update
- **Documentation 2**: Description of documentation update

## 🧪 Test Coverage
<!-- Document test coverage -->

### Unit Tests Added
<!-- List any new unit tests -->

- **Test 1**: Description of unit test
- **Test 2**: Description of unit test

### Integration Tests Added
<!-- List any new integration tests -->

- **Test 1**: Description of integration test
- **Test 2**: Description of integration test

### Test Coverage Impact
<!-- Document test coverage impact -->

- **Coverage Change**: Description of test coverage change

## 🔍 Review Focus Areas
<!-- Highlight specific areas you'd like reviewers to focus on -->

### Code Quality Focus
<!-- Areas to focus on for code quality review -->

- **Area 1**: Description of focus area
- **Area 2**: Description of focus area

### Performance Focus
<!-- Areas to focus on for performance review -->

- **Area 1**: Description of focus area
- **Area 2**: Description of focus area

### Security Focus
<!-- Areas to focus on for security review -->

- **Area 1**: Description of focus area
- **Area 2**: Description of focus area

## 📋 Additional Notes
<!-- Any other information that reviewers should know -->

### Implementation Details
<!-- Additional implementation details -->

### Design Decisions
<!-- Explain any important design decisions -->

### Future Considerations
<!-- Any future considerations or follow-up work -->

---

## ✅ Final Checklist

### Before Submitting
- [ ] All tests pass locally
- [ ] Code follows project conventions
- [ ] Documentation is updated
- [ ] Screenshots are included (for UI changes)
- [ ] Breaking changes are documented
- [ ] Performance impact is assessed
- [ ] Security implications are considered
- [ ] Accessibility is maintained/improved

### CodeRabbit Integration
- [ ] CodeRabbit configuration is followed
- [ ] All automated checks pass
- [ ] Review comments are addressed
- [ ] Code quality standards are met

**By submitting this pull request, I confirm that:**
- [ ] I have read and followed the project's contributing guidelines
- [ ] My code follows the project's coding standards
- [ ] I have tested my changes thoroughly
- [ ] I have updated documentation as needed
- [ ] My changes do not break existing functionality
- [ ] I have considered performance, security, and accessibility implications
- [ ] I have followed the commit message conventions
- [ ] I have provided clear and comprehensive testing information 