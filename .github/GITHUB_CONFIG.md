# GitHub Configuration

This directory contains GitHub-specific configuration files for the FFP project.

## Contents

### Workflows (`.github/workflows/`)

Automated CI/CD pipelines:

1. **`auto-pr.yml`** - Automatically creates draft PRs when pushing to feature branches
2. **`ci.yml`** - Quality checks (typecheck, lint, build, test) on every push

**Detailed guide:** [WORKFLOWS.md](./WORKFLOWS.md)

### Templates

- **`pull_request_template.md`** - PR template with checklist for all pull requests

### Documentation

- **`WORKFLOWS.md`** - Comprehensive guide to all GitHub Actions workflows

## Quick Start

### 1. Enable GitHub Actions

```bash
Repository Settings → Actions → General
├── Allow all actions and reusable workflows
└── Read and write permissions
    └── Allow GitHub Actions to create and approve pull requests
```

### 2. Create Feature Branch

```bash
# Use FFP ticket number
git checkout -b FFP-20-typescript-paths
```

### 3. Push to GitHub

```bash
# Make changes, then:
git add .
git commit -m "FFP-20: Configure TypeScript paths"
git push -u origin FFP-20-typescript-paths
```

### 4. Auto-PR Created

GitHub Actions will:

- Create draft PR automatically
- Add Jira ticket link
- Run CI checks
- Add helpful commands in comments

## Branch Naming Conventions

Auto-PR triggers on:

- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance tasks
- `FFP-*` - Jira ticket branches _(recommended)_

## Workflow Permissions

All workflows use `GITHUB_TOKEN` (no secrets needed):

- Read repository
- Create pull requests
- Add comments
- Run status checks

## Files Overview

```
.github/
├── workflows/
│   ├── auto-pr.yml           # Auto-create PRs (~30s per push)
│   └── ci.yml                # Quality checks (~3min per push)
├── pull_request_template.md  # PR checklist template
├── WORKFLOWS.md              # Detailed workflow documentation
└── README.md                 # This file
```

## Usage Patterns

### Standard Development Flow

```bash
# 1. Create feature branch
git checkout -b FFP-XX-feature-name

# 2. Make changes
# ... code changes ...

# 3. Run checks locally
pnpm typecheck && pnpm lint && pnpm build

# 4. Commit with descriptive message
git commit -m "FFP-XX: Brief description

- Detailed change 1
- Detailed change 2"

# 5. Push (triggers auto-PR + CI)
git push -u origin FFP-XX-feature-name

# 6. Review auto-created PR on GitHub
# 7. Update PR description with actual changes
# 8. Mark as ready for review
# 9. Merge when CI passes
```

### Skip Auto-PR (for WIP)

```bash
git commit -m "WIP: debugging issue [skip-pr]"
git push
```

### Manual PR Creation

```bash
# If you prefer manual PRs, just push to main
git checkout main
git pull
git add .
git commit -m "FFP-XX: Direct commit to main"
git push origin main
```

## CI/CD Pipeline

### On Every Push

```mermaid
Push → CI Workflow
  ├── Install dependencies
  ├── Type check (pnpm typecheck)
  ├── Lint (pnpm lint)
  ├── Build (pnpm build)
  └── Test (pnpm test)
```

### On Feature Branch Push

```mermaid
Push → Auto-PR Workflow
  ├── Check if PR exists
  ├── Extract ticket info
  ├── Create draft PR
  └── Add commands comment
```

## Monitoring

### View Workflow Status

```bash
# Install GitHub CLI
brew install gh
gh auth login

# List recent workflow runs
gh run list

# View specific run
gh run view <run-id> --log

# Watch current run
gh run watch
```

### Check Action Minutes Usage

Free tier: **2,000 minutes/month**

Estimated FFP usage:

- CI checks: ~3 min/push × ~20 pushes/month = 60 min
- Auto-PR: ~0.5 min/push × ~20 pushes/month = 10 min

**Total: ~70 min/month** (well within free tier)

## Customisation

### Modify PR Target Branch

Edit `auto-pr.yml`, line ~95:

```yaml
gh pr create \
  --base develop \  # Change from 'main' to 'develop'
  --head "$BRANCH_NAME"
```

### Add More CI Checks

Edit `ci.yml` and add steps:

```yaml
- name: Security Audit
  run: pnpm audit

- name: Check Bundle Size
  run: pnpm run size-limit
```

## Troubleshooting

### Auto-PR Not Creating

**Issue:** Pushed to feature branch but no PR created

**Solutions:**

1. **Check branch name:**

   ```bash
   git branch --show-current
   # Must match: feature/*, fix/*, chore/*, or FFP-*
   ```

2. **Check commit message:**

   ```bash
   git log -1
   # Must NOT contain [skip-pr]
   ```

3. **Check if PR exists:**

   ```bash
   gh pr list --head $(git branch --show-current)
   ```

4. **Check workflow logs:**

   ```bash
   gh run list --workflow=auto-pr.yml
   gh run view <run-id> --log
   ```

5. **Verify GitHub Actions enabled:**
   - Settings → Actions → General
   - Read and write permissions
   - Allow creating PRs

### CI Checks Failing

**Issue:** CI workflow shows red X

**Solutions:**

1. **Run checks locally:**

   ```bash
   pnpm typecheck  # Check for type errors
   pnpm lint       # Check for lint errors
   pnpm build      # Check for build errors
   ```

2. **View CI logs:**

   ```bash
   gh run list --workflow=ci.yml
   gh run view <latest-run-id> --log
   ```

3. **Fix errors and push again:**

   ```bash
   # Fix issues locally
   pnpm lint --fix

   # Commit fixes
   git add .
   git commit -m "fix: resolve CI issues"
   git push
   ```

### Workflow Permissions Error

**Issue:** Workflow fails with permissions error

**Solution:** Enable workflow permissions:

1. Settings → Actions → General
2. Workflow permissions → **Read and write permissions**
3. **Allow GitHub Actions to create and approve pull requests**
4. Save

## Best Practices

### Do

- Use FFP ticket numbers in branch names (`FFP-20-feature`)
- Write descriptive commit messages
- Run checks locally before pushing
- Update PR descriptions after auto-creation
- Use draft PRs for work in progress
- Review CI results before merging

### Don't

- Push directly to `main` (unless intentional)
- Ignore CI failures
- Skip PR descriptions
- Merge without reviewing changes
- Disable workflows without understanding impact

## Security Notes

### Secrets Management

- Use `GITHUB_TOKEN` (automatically provided)
- Never commit AWS credentials or API keys
- Use GitHub Secrets for sensitive data
- Use AWS Secrets Manager for production secrets

### Branch Protection

Recommended for `main` branch:

```
Settings → Branches → Add rule
├── Branch name pattern: main
├── Require pull request before merging
├── Require status checks to pass (CI)
├── Require branches to be up to date
└── Do not allow bypassing the above settings
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [peter-evans/create-pull-request](https://github.com/marketplace/actions/create-pull-request)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

## Support

**Questions or issues with workflows?**

1. Check [WORKFLOWS.md](./WORKFLOWS.md) for detailed documentation
2. View workflow logs: `gh run list`
3. Check GitHub Actions tab on repository

---

**Last Updated:** April 2026  
**Maintained By:** Christopher Tregaskis
