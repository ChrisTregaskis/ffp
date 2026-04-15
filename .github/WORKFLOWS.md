# GitHub Actions Setup Guide

## Overview

Three GitHub Actions workflows have been configured:

1. **Auto PR Creation** (`auto-pr.yml`) - Creates draft PRs when pushing feature branches
2. **CI Checks** (`ci.yml`) - Quality gates on every push

## 1. Auto PR Creation (auto-pr.yml)

### What it does

- Automatically creates a **draft PR** when you push to feature branches
- Extracts FFP ticket numbers from branch names
- Adds Jira links automatically
- Prevents duplicate PRs
- Skippable with `[skip-pr]` in commit message

### Branch patterns that trigger auto-PR:

- `feature/*` - e.g., `feature/user-authentication`
- `fix/*` - e.g., `fix/login-bug`
- `chore/*` - e.g., `chore/update-deps`
- `FFP-*` - e.g., `FFP-19-workspace-dependencies`

### Example workflow:

```bash
# Create feature branch
git checkout -b FFP-20-typescript-paths

# Make changes and commit
git add .
git commit -m "FFP-20: Configure TypeScript path mappings"

# Push to GitHub
git push origin FFP-20-typescript-paths

# GitHub Actions automatically creates a draft PR
```

### Skip auto-PR creation:

```bash
git commit -m "WIP: incomplete changes [skip-pr]"
git push
```

### Generated PR includes:

- Jira ticket link (if FFP-XX in branch name)
- Basic template with checklist
- Useful commands in comments
- Created as **draft** (mark ready when complete)

---

## 2. CI Checks (ci.yml)

### What it does

- Runs on every push and PR
- Executes: typecheck, lint, build, test
- Provides quality gate feedback
- Shows results in PR checks

### Local equivalent:

```bash
# Run same checks locally before pushing
pnpm typecheck
pnpm lint
pnpm build
pnpm test
```

---

## Setup Requirements

### 1. No additional secrets needed!

All workflows use the built-in `GITHUB_TOKEN` which has:

- Read access to repository
- Write access to pull requests
- Permission to create branches

### 2. Enable GitHub Actions

1. Go to repository **Settings** → **Actions** → **General**
2. Ensure **"Allow all actions and reusable workflows"** is selected
3. Set **Workflow permissions** to:
   - **Read and write permissions**
   - **Allow GitHub Actions to create and approve pull requests**

### 3. Branch Protection (Optional but Recommended)

For `main` branch:

1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - Require pull request before merging
   - Require status checks to pass (CI workflow)
   - Require branches to be up to date

---

## Workflow Permissions

### What each workflow can do:

**auto-pr.yml:**

- Create draft PRs
- Add comments to PRs
- List existing PRs

**ci.yml:**

- Read code
- Run tests/builds
- Report status

---

## Customisation Options

### Change auto-PR target branch

Edit `auto-pr.yml`:

```yaml
# Change from 'main' to 'develop'
gh pr create \
  --base develop \  # ← Change this
  --head "$BRANCH_NAME"
```

### Adjust CI strictness

Edit `ci.yml`:

```yaml
# Make tests required (fail workflow if tests fail)
- name: Test
  run: pnpm test
  continue-on-error: false # ← Change from true
```

---

## Troubleshooting

### Auto-PR not creating

**Check:**

1. Branch name matches patterns (feature/_, fix/_, FFP-\*)
2. Commit message doesn't contain `[skip-pr]`
3. PR doesn't already exist for branch
4. GitHub Actions has write permissions

**Debug:**

```bash
# View workflow runs
gh run list --workflow=auto-pr.yml

# View specific run logs
gh run view <run-id> --log
```

### CI checks failing

**Common issues:**

1. TypeScript errors → `pnpm typecheck` locally first
2. Lint errors → `pnpm lint --fix` before pushing
3. Build failures → `pnpm build` locally first

---

## Best Practices

### For solo development:

1. **Use feature branches** with FFP ticket numbers:

   ```bash
   git checkout -b FFP-20-typescript-paths
   ```

2. **Let auto-PR create draft**:
   - Review generated PR
   - Update description with actual changes
   - Mark as "Ready for review"
   - Merge when CI passes

3. **Run checks locally first**:

   ```bash
   pnpm typecheck && pnpm lint && pnpm build
   ```

4. **Skip auto-PR for WIP commits**:
   ```bash
   git commit -m "WIP: debugging [skip-pr]"
   ```

### For team development (future):

1. **Require PR reviews** (branch protection)
2. **Enforce CI checks** before merge
3. **Add more quality gates** (coverage, security scans)

---

## Next Steps

### After first push:

1. Verify auto-PR was created
2. Check CI workflow runs successfully
3. Review PR template and adjust if needed
4. Mark PR ready and merge

### Optional enhancements:

- Add code coverage reporting
- Add security scanning (Dependabot, CodeQL)
- Add deployment workflows (when SST is configured)
- Add release automation

---

## Files Structure

```
.github/
└── workflows/
    ├── auto-pr.yml          # Auto-create PRs on feature branch push
    └── ci.yml               # Quality checks on every push
```

---

**Questions or issues?** Check workflow logs in GitHub Actions tab or raise an issue.
