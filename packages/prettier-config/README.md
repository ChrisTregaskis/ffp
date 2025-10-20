# @ffp/prettier-config

Shared Prettier configuration for the FFP monorepo.

## Usage

In your package root, create a `.prettierrc.js`:

```javascript
module.exports = require('@ffp/prettier-config');
```

Or reference it in `package.json`:

```json
{
  "prettier": "@ffp/prettier-config"
}
```

## Package Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\""
  }
}
```

## VS Code Integration

Install the Prettier extension and add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```
