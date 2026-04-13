# GitHub Repository Setup Guide

## 🚀 Initial Setup

### 1. Create `develop` Branch

```bash
# From your local machine
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

### 2. Rename Current Feature Branch to `develop` (if needed)

If your current branch is `feature-apex-ai-screens-*`:

```bash
# You can keep it as is for now
# When ready to integrate Vertex features:
git checkout main
git pull
git checkout -b develop
git push -u origin develop
```

## 🔐 Branch Protection Rules

### Set Up Protection for `main`

**Via GitHub UI:**

1. Go to repository → Settings
2. Click "Branches" in left sidebar
3. Click "Add rule" under "Branch protection rules"
4. Enter branch name pattern: `main`
5. ✅ Check all:
   - Require pull request reviews before merging (1 required)
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Include administrators
   - Restrict who can push to matching branches
6. Save

### Set Up Protection for `develop`

Same as above, but:

- Branch name pattern: `develop`
- Require pull request reviews: 1 required
- Status checks required

### Set Up Protection for Releases

Pattern: `release/**`

- Require pull request reviews
- Require status checks

## 🤖 Enable GitHub Actions

1. Go to repository → Actions
2. Click "Enable GitHub Actions"
3. Workflows in `.github/workflows/` will auto-run

## 📋 CODEOWNERS File (Optional but Recommended)

Create `.github/CODEOWNERS`:

```
# Core features
src/screens/ @yourusername
src/components/ @yourusername
src/context/ @yourusername
src/constants/ @yourusername
src/data/ @yourusername
src/utils/ @yourusername

# Configuration
package.json @yourusername
app.json @yourusername
tsconfig.json @yourusername

# Documentation
*.md @yourusername
```

**Effect:** When PR changes these files, listed owners must approve.

## 📝 Adding a LICENSE

```bash
# Add MIT License (common for open source)
git checkout main
# Create LICENSE file with MIT license text
git add LICENSE
git commit -m "📄 Add MIT license"
git push origin main
```

## 🏷️ Create GitHub Labels

Useful for organizing issues:

- `type: feature` - New feature
- `type: bug` - Bug report
- `type: docs` - Documentation
- `priority: high` - High priority
- `priority: low` - Low priority
- `status: blocked` - Blocked by something
- `help wanted` - Looking for help
- `good first issue` - Good for beginners

**Via GitHub UI:**

1. Issues → Labels
2. "New label" button
3. Add each label

## 🔔 Set Up Notifications

**Repository Settings → Notifications:**

- ✅ Watch this repository
- Select: "All Activity" or "Participating and mentions"

## 📊 Enable GitHub Projects (Optional)

For tracking issues and PRs:

1. Projects tab
2. "New project"
3. Choose template: "Table", "Board", or "Roadmap"
4. Add issues/PRs to track

## 🚀 Deploy from GitHub

For Expo projects, you can:

1. Connect Expo to GitHub
2. Auto-build on commits
3. QR code for testing

**Steps:**

```bash
# Install Expo CLI globally
npm install -g eas-cli

# Authenticate
eas login

# Configure
eas build --platform all
```

## ✅ Pre-Launch Checklist

- [ ] `main` branch exists and is protected
- [ ] `develop` branch exists and is protected
- [ ] `.github/workflows/ci.yml` exists
- [ ] `.github/workflows/build.yml` exists
- [ ] `.github/pull_request_template.md` exists
- [ ] Branch protection rules configured
- [ ] GitHub Actions enabled
- [ ] README.md updated with branch info
- [ ] CHANGELOG.md created
- [ ] LICENSE added
- [ ] Labels created

## 📖 Team Collaboration

### When Team Member Joins

Send them:

1. This guide: `GITHUB_BRANCHING_STRATEGY.md`
2. Development setup: `npm install && npx expo start`
3. PR template automatically appears when they create PR

### Code Review Checklist

When reviewing PRs:

- [ ] **Functionality**: Does it work as described?
- [ ] **Code Quality**: Clean, readable code?
- [ ] **Tests**: All CI checks passing?
- [ ] **Vertex Features**: Plan gating correct?
- [ ] **Dark Mode**: Tested in both themes?
- [ ] **Documentation**: Updated as needed?
- [ ] **No Breaking Changes**: (unless intentional)
- [ ] **Performance**: No unnecessary re-renders?

## 🔄 Syncing Forks (if contributors fork)

Contributors should:

```bash
# Add original repo as upstream
git remote add upstream https://github.com/Youssefff112/grad-project.git

# Keep in sync
git fetch upstream
git rebase upstream/develop
```

## 📞 Common GitHub Questions

### "How do I make my PR?"

1. Fork the repo
2. Create feature branch
3. Make changes
4. Push to your fork
5. Click "Compare & pull request" on GitHub
6. Write description, submit

### "My PR is behind main"

```bash
git fetch origin
git rebase origin/main
git push origin feature-branch --force-with-lease
```

### "How do I see CI results?"

1. Go to PR
2. Click "Checks" tab
3. See detailed test results
4. Failed checks block merge

### "Can I merge without all checks?"

Only if you're an admin and uncheck "Require status checks"
(Not recommended!)

## 🎯 Example: First PR

### Step 1: Clone

```bash
git clone https://github.com/Youssefff112/grad-project.git
cd grad-project
npm install
```

### Step 2: Create Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature-add-profile-screen
```

### Step 3: Make Changes

```bash
# Edit files
# Test: npx expo start
```

### Step 4: Commit

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "✨ Add new profile screen with plan display"
```

### Step 5: Push

```bash
git push -u origin feature-add-profile-screen
```

### Step 6: Create PR on GitHub

- Go to GitHub
- Click "Compare & pull request"
- Add title: "Add profile screen"
- Add description: "Displays user plan and profile info"
- Click "Create pull request"

### Step 7: Wait for CI

- GitHub runs tests automatically
- See results in "Checks" tab
- Must all pass

### Step 8: Code Review

- Team reviews code
- Makes comments
- Approves or requests changes

### Step 9: Merge

- After approval & CI passing
- Click "Squash and merge"
- Delete branch

✅ Done! Your feature is on `develop`!

---

**Last Updated:** 2026-04-13  
**Ready for Production:** Yes
