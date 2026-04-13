# GitHub Branch & Pipeline Strategy

## 📊 Branch Structure

```
main (production)
  ├─ Releases only
  ├─ Protected (requires PR review)
  └─ CI/CD: Tests + Build verification

develop (staging)
  ├─ Integration branch
  ├─ PR reviews required
  └─ CI/CD: Tests + Build verification

feature-* (feature branches)
  ├─ For new features
  ├─ Based on: develop
  ├─ Naming: feature-{description}
  └─ CI: Tests only

bugfix-* (bug branches)
  ├─ For bug fixes
  ├─ Based on: develop
  ├─ Naming: bugfix-{description}
  └─ CI: Tests only

hotfix-* (hotfix branches)
  ├─ Urgent production fixes
  ├─ Based on: main
  ├─ Naming: hotfix-{description}
  └─ CI: Full verification
```

## 🔄 Workflow

### New Feature Development

```
1. Create feature branch from develop
   $ git checkout develop
   $ git pull origin develop
   $ git checkout -b feature-add-notifications

2. Make changes and commit
   $ git commit -m "✨ Add notification system"

3. Push and create PR
   $ git push origin feature-add-notifications
   → Create PR to develop
   → CI runs: tests, build checks
   → Code review requested

4. After approval: Merge to develop
   → Delete feature branch
   → CI runs again on develop
   → Tests passing

5. When ready: Release to main
   $ git checkout main
   $ git pull origin main
   $ git merge develop
   $ git tag v1.2.0
   $ git push origin main --tags
   → CI runs full verification
```

### Bug Fix

```
1. Create bugfix branch from develop
   $ git checkout -b bugfix-fix-login-crash

2. Fix and test locally
   $ npx expo start

3. Commit with emoji
   $ git commit -m "🐛 Fix login crash on Android"

4. Create PR to develop
   → CI checks TypeScript, structure, features
   → Review required

5. Merge after approval
```

### Hotfix (Production Issue)

```
1. Create hotfix from main
   $ git checkout main
   $ git checkout -b hotfix-critical-payment-bug

2. Fix immediately
   $ git commit -m "🔥 Fix payment processing"

3. PR to main (expedited review)
   → Full CI runs
   → Urgent release

4. After merge to main:
   $ git checkout develop
   $ git merge main
   → Keep develop in sync
```

## 🤖 CI/CD Pipelines

### Workflow 1: CI - Lint & Test (`ci.yml`)

**Triggers:**

- Push to: `main`, `develop`, `feature-*` branches
- PR to: `main`, `develop`

**Checks:**

- ✅ Installs dependencies
- ✅ TypeScript type checking
- ✅ Project structure validation
- ✅ Expo configuration
- ✅ Verifies Vertex features (plans, mockUsers, etc)
- ✅ Runs on Node 18.x and 20.x

**Status:** Pass/Fail blocks merge

### Workflow 2: Build - Expo Verification (`build.yml`)

**Triggers:**

- Push to: `main`, `develop`
- PR to: `main`, `develop`

**Checks:**

- ✅ Verifies Expo CLI ready
- ✅ Validates app.json
- ✅ TypeScript compilation
- ✅ Critical files present (plans.ts, mockUsers.ts, etc)
- ✅ Documentation structure
- ✅ Ready for deployment

**Status:** Informational (doesn't block)

## 🛡️ Branch Protection Rules

### For `main` branch:

```
✓ Require PR reviews: 1+ approvals
✓ Dismiss stale reviews: Yes
✓ Require status checks: CI & Build passing
✓ Require branches up to date: Yes
✓ Restrict who can push: Only admins
✓ Allow force pushes: No (never)
✓ Allow deletions: No
```

### For `develop` branch:

```
✓ Require PR reviews: 1+ approvals
✓ Require status checks: CI passing
✓ Require branches up to date: Yes
✓ Restrict who can push: Admins only
✓ Allow force pushes: No
✓ Allow deletions: No
```

## 📝 Commit Message Convention

```
{emoji} {type}: {description}

✨ Feature: Add new functionality
🐛 Bug: Fix a bug
📚 Docs: Update documentation
♻️ Refactor: Improve code structure
🚀 Perf: Performance improvement
🧪 Test: Add or update tests
🔒 Security: Security improvements
```

### Examples:

```
✨ Feature: Add AI chat feature gating for Premium plan
🐛 Bug: Fix login crash on Android devices
📚 Docs: Update registration flow documentation
♻️ Refactor: Simplify planUtils functions
🚀 Perf: Optimize feature access checks
🧪 Test: Add unit tests for hasFeatureAccess
```

## 🔀 Merging Strategy

### Default: Squash and Merge

**Why:**

- Keeps main/develop history clean
- Feature branch history preserved on GitHub
- Easy to revert if needed

```
PR with 5 commits → 1 commit on main/develop
```

### When to use Full Merge:

- Release merges (main ← develop)
- Important feature bundles (document why)

## 📊 Release Process

### Semantic Versioning: `v{MAJOR}.{MINOR}.{PATCH}`

```
v1.0.0 - Initial release
v1.1.0 - New Vertex features added
v1.1.1 - Bug fix
v2.0.0 - Breaking changes
```

### Steps:

```
1. Ensure all features in develop
2. Create PR: develop → main
3. All CI checks pass
4. Get approval & merge
5. Create tag: v1.2.0
6. Push tag: git push origin v1.2.0
7. Create GitHub Release
8. Update CHANGELOG.md
```

## ✅ Pre-Commit Checklist

Before pushing a PR:

- [ ] Branch name follows convention: `feature-*`, `bugfix-*`, etc
- [ ] Commits use emoji convention
- [ ] All changes tested locally: `npx expo start`
- [ ] TypeScript: `npx tsc --noEmit` passes
- [ ] No console errors/warnings
- [ ] Feature gating works if applicable
- [ ] Dark/light mode tested
- [ ] Documentation updated
- [ ] No sensitive data committed
- [ ] No large files added

## 🚨 Common Issues

### PR Blocked by Failed CI

**Check:**

1. Read CI error in "Checks" tab
2. Usually TypeScript or structure issue
3. Fix locally and push again
4. CI re-runs automatically

### Branch Out of Date

**Fix:**

```
$ git fetch origin
$ git rebase origin/develop
$ git push origin feature-branch --force-with-lease
```

### Need to Update main Locally

```
$ git checkout main
$ git pull origin main
```

### Accidentally Committed to Wrong Branch

```
$ git reset --soft HEAD~1  # Undo last commit, keep changes
$ git checkout -b correct-branch
$ git commit -m "your message"
$ git push origin correct-branch
```

## 📖 Documentation

All workflows and rules are defined in:

- `.github/workflows/ci.yml` - Linting & testing
- `.github/workflows/build.yml` - Build verification
- `.github/pull_request_template.md` - PR template

## 🎯 Best Practices

✅ DO:

- Keep feature branches short-lived (max 2 weeks)
- Review code changes before merging
- Write clear commit messages
- Test locally before pushing
- Update documentation with code changes
- Communicate about major changes

❌ DON'T:

- Force push to main/develop
- Merge without tests passing
- Commit secrets or API keys
- Add large binary files
- Work directly on main/develop
- Skip code review requirements

## 🔗 Useful Commands

```bash
# Create feature branch
git checkout -b feature-my-feature

# Push and set upstream
git push -u origin feature-my-feature

# Update from main
git fetch origin main
git rebase origin/main

# Create PR (using GitHub CLI)
gh pr create --base develop --title "Add feature" --body "Description"

# List branches
git branch -a

# Delete local branch
git branch -d feature-my-feature

# Delete remote branch
git push origin --delete feature-my-feature
```

---

**Last Updated:** 2026-04-13  
**Version:** 1.0.0
