# @ffp/eslint-config

Shared ESLint configuration for the FFP monorepo.

## Configurations

### Base Configuration

For Node.js and core packages:

```javascript
// .eslintrc.js
module.exports = {
  extends: ['@ffp/eslint-config/node'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
```

### React Configuration

For React/frontend packages:

```javascript
// .eslintrc.js
module.exports = {
  extends: ['@ffp/eslint-config/react'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
```

## Package Scripts

Each package should have:

```json
{
  "scripts": {
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

## Integration with Prettier

This configuration includes `eslint-config-prettier` to disable rules that conflict with Prettier formatting.
