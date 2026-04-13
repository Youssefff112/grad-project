# Pull Request

## 📋 Description

<!-- Describe your changes here -->

## 🎯 Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Test addition/update

## 🔗 Related Issues

<!-- Link to related issues: Fixes #123 or Related to #456 -->

Closes #

## ✅ Checklist

### Code Quality

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings

### Testing

- [ ] I have tested this locally with `npx expo start`
- [ ] I have tested on both light and dark modes
- [ ] I have tested with multiple plan types (Free, Standard, Premium, ProCoach, Elite)
- [ ] I have verified feature gating works correctly

### Vertex Features

- [ ] My changes don't break existing plan-based feature gating
- [ ] If adding new features, they are properly gated in plans.ts
- [ ] If adding new screens, feature access is checked
- [ ] FeatureLocked component is used for restricted features

### Documentation

- [ ] I have updated relevant documentation files
- [ ] Code comments added for new functionality
- [ ] User flows documented if applicable

## 📸 Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## 🚀 Deployment Notes

<!-- Any special considerations for deployment -->

## 👥 Reviewers

<!-- Tag reviewers if needed -->

---

## Development Guidelines

### Branch Naming

- Feature: `feature-{description}` (e.g., `feature-add-notifications`)
- Bug: `bugfix-{description}` (e.g., `bugfix-login-crash`)
- Hotfix: `hotfix-{description}` (e.g., `hotfix-critical-ui-bug`)

### Commit Messages

- Use imperative mood ("Add feature" not "Added feature")
- Start with an emoji:
  - ✨ New feature
  - 🐛 Bug fix
  - 📚 Documentation
  - ♻️ Refactoring
  - 🚀 Performance
  - ✅ Tests

Example: `✨ Add AI chat feature gating for Premium plan`

### Plan Types Reference

- **Free**: Basic tracking (Food, Water, Exercise, Videos)
- **Standard**: Free + Enhanced metrics
- **Premium**: Standard + AI (Chat, Workouts, Meals) + Computer Vision
- **ProCoach**: Free + Coach features (Chat, Analytics, Dashboard) + Computer Vision
- **Elite**: Premium + ProCoach (Everything)
