# Turborepo Caching Configuration

## Quick Reference

### Key Optimisations Applied

1. **Intelligent Input Filtering** - Excludes markdown and test files from build cache keys
2. **Explicit Output Declarations** - Caches dist/, build/, coverage/ with exclusions
3. **Output Log Control** - `errors-only` for cleaner output, `new-only` for tests
4. **Global Dependencies** - Shared configs trigger cache invalidation across packages
5. **Remote Caching Ready** - Prepared for team collaboration (currently disabled)

### Cache Performance

**Cold Build:** ~10-15 seconds  
**Warm Cache:** ~100-300ms ⚡  
**Speed Improvement:** 30-100x faster

---

## Task Configurations

### Build

- **Depends On:** `^build` (dependencies build first)
- **Inputs:** Source code, configs (excludes markdown, tests)
- **Outputs:** `dist/`, `.next/`, `build/`
- **Cache:** Enabled

### Typecheck

- **Depends On:** `^build` (needs dependency types)
- **Inputs:** Source code, configs (excludes markdown)
- **Outputs:** None (type checking only)
- **Cache:** Enabled, errors-only logs

### Lint

- **Depends On:** None (runs in parallel)
- **Inputs:** Source code, configs (excludes markdown)
- **Outputs:** None
- **Cache:** Enabled, errors-only logs

### Test

- **Depends On:** `build` (tests run on compiled code)
- **Inputs:** Source code, test files (excludes markdown)
- **Outputs:** `coverage/`
- **Cache:** Enabled, new-only logs

### Dev

- **Depends On:** `^build` (dependencies built first)
- **Cache:** Disabled (long-running, stateful)
- **Persistent:** True (never exits)

---

## Input Microsyntax: `$TURBO_DEFAULT$`

Turborepo's default file tracking with custom exclusions:

```json
"inputs": [
  "$TURBO_DEFAULT$",
  "!**/*.md",          // Documentation changes don't affect builds
  "!**/*.test.ts",     // Test files don't affect production builds
  "!**/*.spec.tsx"
]
```

**Benefits:**

- Higher cache hit ratios
- Faster feedback loops
- Update docs without triggering rebuilds

---

## Cache Hit Scenarios

### ✅ Cache Hit Examples

1. **Update Documentation** - Edit README.md → All tasks hit cache
2. **Fix Typo in One Package** - Only that package rebuilds
3. **Add Test Files** - Build/lint hit cache (tests excluded from inputs)

### ❌ Cache Miss Examples

1. **Update Shared Config** - Edit `tsconfig.base.json` → All packages rebuild
2. **Change Environment Variable** - `NODE_ENV` affects cache key
3. **Modify Package Dependencies** - `package.json` changes trigger rebuild

---

## Debugging Commands

```bash
# See what would execute without running
pnpm turbo run build --dry

# View detailed task information
pnpm turbo run build --summarize

# Force cache miss (useful for testing)
pnpm turbo run build --force

# Clear local cache
rm -rf node_modules/.cache/turbo
```

---

## Best Practices

### ✅ Do

- Define explicit outputs for all file-producing tasks
- Exclude irrelevant files from cache keys
- Use `$TURBO_DEFAULT$` as base, then fine-tune
- Enable remote caching for teams
- Use `--force` to debug cache issues

### ❌ Don't

- Cache long-running dev servers
- Include markdown in build cache keys
- Forget to declare outputs
- Store secrets in turbo.json

---

## Testing the Configuration

Run these commands to verify caching works:

```bash
# First build (cold cache)
time pnpm turbo run build

# Clear and rebuild (should be instant)
rm -rf packages/*/dist
time pnpm turbo run build

# Update a markdown file, rebuild (should hit cache)
echo "# Test" >> packages/core/README.md
time pnpm turbo run build
```

**Expected:** Second and third builds complete in ~100-300ms

---

## References

- [Turborepo Caching Guide](https://turbo.build/repo/docs/crafting-your-repository/caching)
- [Configuration Reference](https://turbo.build/repo/docs/reference/configuration)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
