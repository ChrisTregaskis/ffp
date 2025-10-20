# GitHub Actions Setup - Quick Reference

**Created:** October 20, 2025  
**Status:** ✅ Ready to use

---

## 🎯 What You've Got

### Two Automated Workflows

1. **Auto-PR Creation** (`auto-pr.yml`)

   - Creates draft PRs on feature branch push
   - Extracts FFP ticket numbers
   - Adds Jira links automatically
   - **Triggers:** Push to `feature/*`, `fix/*`, `chore/*`, `FFP-*`

2. **CI Quality Checks** (`ci.yml`)

   - Runs typecheck, lint, build, test
   - Provides quality gate feedback
   - **Triggers:** Every push and PR

---

## 🚀 Before First Push: Enable GitHub Actions

**CRITICAL STEP - Do this first!**

1. Go to your GitHub repository
2. **Settings** → **Actions** → **General**
3. Set the following:

   **Actions permissions:**

   - ✅ **Allow all actions and reusable workflows**

   **Workflow permissions:**

   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

4. Click **Save**

**Without these settings, workflows will fail!**

---

## 📝 Your First Push with Auto-PR

```bash
# 1. Create feature branch (use FFP ticket number)
git checkout -b FFP-19-workspace-dependencies

# 2. Make your changes
# ... edit files ...

# 3. Run checks locally (optional but recommended)
pnpm typecheck
pnpm lint
pnpm build

# 4. Commit with good message
git add .
git commit -m "FFP-19: Configure workspace dependencies

- Added workspace:* protocol for @ffp/core
- Created health check handler
- Verified type exports
- Updated documentation"

# 5. Push to GitHub (triggers auto-PR!)
git push -u origin FFP-19-workspace-dependencies

# 6. Check GitHub - draft PR should be created automatically! 🎉
```

---

## ✅ What Happens Next

1. **Auto-PR Workflow** runs (~30 seconds)

   - Checks if PR exists (prevents duplicates)
   - Extracts "FFP-19" from branch name
   - Creates draft PR with:
     - Title: "FFP-19: Workspace Dependencies"
     - Jira link: https://ctregaskis.atlassian.net/browse/FFP-19
     - Template with checklist
     - Helpful commands in comments

2. **CI Workflow** runs (~3 minutes)

   - Type checking
   - Linting
   - Building
   - Testing

3. **You Review & Merge**
   - Update PR description with actual changes
   - Check CI passed (green checkmark)
   - Mark as "Ready for review"
   - Merge when satisfied

---

## 🎨 Branch Naming Guide

Auto-PR works with these patterns:

```bash
# ✅ WORKS - Auto-PR will create
FFP-20-typescript-paths
FFP-21-eslint-config
feature/user-authentication
fix/login-redirect-bug
chore/update-dependencies

# ❌ DOESN'T TRIGGER - No auto-PR
main
develop
random-branch-name
test
```

**Recommendation:** Always use `FFP-XX-description` format

---

## 🔧 Skip Auto-PR (for WIP commits)

Add `[skip-pr]` to commit message:

```bash
git commit -m "WIP: debugging issue [skip-pr]"
git push
# No PR created, just code pushed
```

---

## 📊 Monitoring Workflows

### Via GitHub Website

1. Go to repository on GitHub
2. Click **Actions** tab
3. See all workflow runs

### Via GitHub CLI (optional)

```bash
# Install
brew install gh
gh auth login

# View recent runs
gh run list

# View specific run logs
gh run view <run-id> --log

# Watch current run
gh run watch
```

---

## 🐛 Troubleshooting

### PR Not Created?

**Checklist:**

- [ ] Branch name matches pattern (`FFP-*`, `feature/*`, etc.)
- [ ] GitHub Actions enabled with correct permissions
- [ ] Commit message doesn't contain `[skip-pr]`
- [ ] PR doesn't already exist for this branch

**Debug:**

```bash
# Check branch name
git branch --show-current

# Check if PR exists
gh pr list --head $(git branch --show-current)

# View workflow logs
gh run list --workflow=auto-pr.yml
```

### CI Checks Failing?

**Run locally first:**

```bash
pnpm typecheck  # Must pass
pnpm lint       # Fix with: pnpm lint --fix
pnpm build      # Must succeed
```

**Then push again:**

```bash
git add .
git commit -m "fix: resolve CI issues"
git push
```

---

## 📚 Documentation Files

All in `.github/` directory:

- **`README.md`** - Overview (this file)
- **`WORKFLOWS.md`** - Comprehensive workflow guide
- **`pull_request_template.md`** - PR checklist template
- **`workflows/`** - Actual workflow YAML files

---

## 💡 Tips for Solo Development

### Recommended Workflow

1. **Always use feature branches** with FFP ticket numbers
2. **Let auto-PR create draft** (saves time)
3. **Review generated PR** and update description
4. **Wait for CI to pass** (green checkmark)
5. **Merge your own PRs** (you're solo, it's fine!)

### Benefits Even Solo

- ✅ Clear change history
- ✅ Automated quality checks
- ✅ Easy rollback if needed
- ✅ Professional git log
- ✅ Forces you to review changes
- ✅ Good habits for future team work

### When to Skip PRs

- Quick documentation fixes
- Typo corrections
- Minor README updates

```bash
# Push directly to main for trivial changes
git checkout main
git add README.md
git commit -m "docs: fix typo"
git push origin main
```

---

## 🎯 Current Status

✅ **FFP-19 Complete** - Workspace dependencies configured  
✅ **GitHub Actions configured** - Ready for first push  
🎯 **Next:** Push FFP-19 to GitHub and verify auto-PR

---

## 🚨 Important Reminders

1. **Enable GitHub Actions permissions FIRST** (or workflows fail)
2. **Use FFP ticket numbers in branch names** (for auto-linking)
3. **Run checks locally before pushing** (faster feedback)
4. **Update PR descriptions** (auto-generated is just template)
5. **Don't panic if something fails** (check logs, fix, push again)

---

## 📦 Files Created

```
.github/
├── workflows/
│   ├── auto-pr.yml              ✅ Auto-create PRs
│   └── ci.yml                   ✅ Quality checks
├── pull_request_template.md     ✅ PR template
├── WORKFLOWS.md                 ✅ Detailed guide
└── README.md                    ✅ This file
```

---

## 🎉 Ready to Push!

Your GitHub Actions are configured and ready to go!

**Next steps:**

1. ✅ Enable GitHub Actions permissions (see above)
2. ✅ Create feature branch: `git checkout -b FFP-19-workspace-dependencies`
3. ✅ Push to GitHub: `git push -u origin FFP-19-workspace-dependencies`
4. ✅ Watch the magic happen! 🪄

**Questions?** Check `.github/WORKFLOWS.md` for detailed documentation.

---

**Happy coding! 🚀**
