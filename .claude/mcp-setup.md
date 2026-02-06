# MCP Server Setup Guide

This document explains how to configure MCP servers for the FFP project in both Claude Desktop and Claude Code.

## Overview

The following MCP servers are configured:

1. **GitHub** - Repository management and GitHub API integration
2. **Atlassian** - Jira work items and project management
3. **Sequential Thinking** - Dynamic problem-solving
4. **Brave Search** - Web search capabilities
5. **Puppeteer** - Browser automation
6. **Tavily** - AI-powered search and research
7. **Context7** - Up-to-date documentation for any framework/library
8. **Gmail** - Email integration for sending notifications

## Prerequisites

- Docker installed and running (for GitHub and Atlassian servers)
- Node.js v20.20.0+ installed via nvm
- API keys and credentials (see below)
- Claude Desktop and/or Claude Code installed

## Environment Variables Setup

Add the following environment variables to your shell configuration file (`~/.bash_profile`, `~/.zshrc`, or `~/.bashrc`):

### GitHub Configuration

```bash
# GitHub Personal Access Token
# Get from: https://github.com/settings/tokens
# Required scopes: repo, read:org, read:user
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"
```

### Atlassian Configuration

```bash
# Jira Settings
export JIRA_URL="https://your-company.atlassian.net"
export JIRA_USERNAME="[email protected]"
# Same API token can be used for both Confluence and Jira
export JIRA_API_TOKEN="your_jira_api_token"
```

### Brave Search Configuration

```bash
# Brave Search API Key
# Get from: https://brave.com/search/api/
export BRAVE_API_KEY="your_brave_api_key"
```

### Tavily Configuration

```bash
# Tavily API Key (for AI-powered search)
# Get from: https://tavily.com/
export TAVILY_API_KEY="your_tavily_api_key"
```

### Context7 Configuration

```bash
# Context7 API Key (for up-to-date documentation)
# Get from: https://context7.com/
export CONTEXT7_API_KEY="your_context7_api_key"
```

### Apply Environment Variables

After adding the environment variables, reload your shell configuration:

```bash
source ~/.bashrc  # or ~/.zshrc, or ~/.bash_profile
```

## Setup Instructions

### Step 1: Configure Environment Variables

1. Add all required environment variables to `~/.bash_profile` (see Environment Variables Setup section above)
2. Reload your shell:
   ```bash
   source ~/.bash_profile
   ```
3. Verify variables are set:
   ```bash
   echo $GITHUB_PERSONAL_ACCESS_TOKEN
   echo $JIRA_URL
   echo $BRAVE_API_KEY
   echo $TAVILY_API_KEY
   echo $CONTEXT7_API_KEY
   ```

### Step 2: Configure Claude Desktop (Optional)

MCP servers are configured in `~/Library/Application Support/Claude/claude_desktop_config.json`. The configuration uses full paths to Node.js executables to avoid version conflicts.

After updating the config, restart Claude Desktop completely (quit and reopen).

### Step 3: Configure Claude Code

Add MCP servers to Claude Code using the CLI:

```bash
# GitHub (requires Docker)
claude mcp add --transport stdio github -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server

# Atlassian (Jira) (requires Docker)
claude mcp add --transport stdio atlassian -e JIRA_URL="${JIRA_URL}" -e JIRA_USERNAME="${JIRA_USERNAME}" -e JIRA_API_TOKEN="${JIRA_API_TOKEN}" -- docker run -i --rm -e JIRA_URL -e JIRA_USERNAME -e JIRA_API_TOKEN ghcr.io/sooperset/mcp-atlassian:latest

# Sequential Thinking
claude mcp add --transport stdio sequential-thinking -- /Users/christophertregaskis/.nvm/versions/node/v20.20.0/bin/node /Users/christophertregaskis/.nvm/versions/node/v20.20.0/lib/node_modules/@modelcontextprotocol/server-sequential-thinking/dist/index.js

# Brave Search
claude mcp add --transport stdio brave-search -e BRAVE_API_KEY="${BRAVE_API_KEY}" -- /Users/christophertregaskis/.nvm/versions/node/v20.20.0/bin/node /Users/christophertregaskis/.nvm/versions/node/v20.20.0/lib/node_modules/@modelcontextprotocol/server-brave-search/dist/index.js

# Puppeteer
claude mcp add --transport stdio puppeteer -- /Users/christophertregaskis/.nvm/versions/node/v20.20.0/bin/node /Users/christophertregaskis/.nvm/versions/node/v20.20.0/lib/node_modules/@modelcontextprotocol/server-puppeteer/dist/index.js

# Tavily
claude mcp add --transport stdio tavily -e TAVILY_API_KEY="${TAVILY_API_KEY}" -- /Users/christophertregaskis/.nvm/versions/node/v20.20.0/bin/node /Users/christophertregaskis/Training/MCP-General/TavilyServer/tavily-mcp/build/index.js

# Context7
claude mcp add --transport stdio context7 -e CONTEXT7_API_KEY="${CONTEXT7_API_KEY}" -- /Users/christophertregaskis/.nvm/versions/node/v20.20.0/bin/npx -y @upstash/context7-mcp --api-key "${CONTEXT7_API_KEY}"

# Gmail
claude mcp add --transport stdio gmail -- npx -y @gongrzhe/server-gmail-autoauth-mcp
```

## Testing MCP Connections

### Claude Code

Test all MCP server connections:

```bash
claude mcp list
```

This command checks the health of all configured servers and displays their status. You should see ✓ Connected for each server.

Example output:

```
github: docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server - ✓ Connected
sequential-thinking: ... - ✓ Connected
atlassian: ... - ✓ Connected
brave-search: ... - ✓ Connected
puppeteer: ... - ✓ Connected
tavily: ... - ✓ Connected
context7: ... - ✓ Connected
gmail: ... - ✓ Connected
```

### Claude Desktop

Check the Claude Desktop logs for MCP server connection status:

1. Open Claude Desktop
2. Look for server initialization messages in the logs
3. Verify no error messages appear for your configured servers

## Verification

Additional verification steps:

1. **Pull Docker images (optional, they'll auto-pull on first use):**

   ```bash
   docker pull ghcr.io/github/github-mcp-server
   docker pull ghcr.io/sooperset/mcp-atlassian:latest
   ```

2. **Test individual server (Claude Code):**
   ```bash
   claude mcp get <server-name>
   ```

## API Key Setup Instructions

### GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Claude Code MCP")
4. Select scopes:
   - `repo` - Full control of private repositories
   - `read:org` - Read org and team membership
   - `read:user` - Read user profile data
5. Click "Generate token" and copy the token immediately
6. Add to your environment variables

### Atlassian API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a label (e.g., "Claude Code MCP")
4. Copy the token immediately
5. Add to your environment variables
6. Note: Same token works for both Jira

### Brave Search API Key

1. Go to https://brave.com/search/api/
2. Sign up or log in
3. Choose a plan (Free tier available)
4. Generate API key from dashboard
5. Add to your environment variables

### Tavily API Key

1. Go to https://tavily.com/
2. Sign up for an account
3. Navigate to the API section in your dashboard
4. Generate a new API key
5. Add to your environment variables

### Context7 API Key

1. Go to https://context7.com/
2. Sign up for an account
3. Navigate to the API section in your dashboard
4. Generate a new API key
5. Add to your environment variables
6. Usage: Add `use context7` to your prompt to fetch up-to-date docs

## Server-Specific Notes

### GitHub

- Requires Docker
- Provides repository management, issue tracking, and GitHub API integration
- Uses Personal Access Token for authentication

### Atlassian (Jira)

- Requires Docker
- Provides Jira work item management and project tracking
- Uses API token for authentication

### Sequential Thinking

- No API key required
- Provides dynamic problem-solving capabilities
- Runs via installed npm package

### Brave Search

- Requires Brave API key
- Provides web search capabilities
- Free tier available

### Puppeteer

- No API key required
- Runs in headless mode by default
- Requires sufficient system resources for browser automation
- Provides web scraping and browser automation capabilities

### Tavily

- Requires Tavily API key
- AI-powered search and research capabilities
- Custom implementation at `~/Training/MCP-General/TavilyServer/tavily-mcp/`

### Context7

- Requires Context7 API key
- Provides up-to-date, version-specific documentation
- Usage: Request library documentation in your prompts
- Pulls documentation from official sources

### Gmail

- No API key required (uses OAuth auto-auth)
- Provides email sending and reading capabilities
- First use will prompt for Google OAuth authentication
- Useful for sending notifications to the dev team

## Troubleshooting

### Docker Permission Issues

If you encounter Docker permission errors:

```bash
# Add your user to the docker group (Linux/Mac)
sudo usermod -aG docker $USER
# Log out and back in, or run:
newgrp docker
```

### NPX Package Not Found

If npx fails to find a package:

```bash
# Clear npm cache
npm cache clean --force

# Or install globally
npm install -g @modelcontextprotocol/server-sequential-thinking
```

### Environment Variables Not Loading

Ensure you've:

1. Added variables to the correct shell config file
2. Reloaded the shell (`source ~/.bashrc`)
3. Restarted Claude Code after setting variables

### Node.js Version Mismatch After Migration

If MCP servers fail after migrating to a new machine:

1. Check your current Node.js version: `node --version`
2. The MCP configs use absolute paths to Node.js (e.g., `/Users/.../.nvm/versions/node/v20.20.0/bin/node`)
3. If the version differs, either:
   - Install the version specified in configs: `nvm install <version>`
   - Or update the MCP configs to use your current version:
     ```bash
     # Remove old config
     claude mcp remove <server-name> -s user
     # Add with new path
     claude mcp add -s user --transport stdio <server-name> -- /path/to/new/node ...
     ```
4. You may also need to reinstall global npm packages:
   ```bash
   npm install -g @modelcontextprotocol/server-sequential-thinking @modelcontextprotocol/server-brave-search @modelcontextprotocol/server-puppeteer
   ```

### Docker Not Running

If GitHub or Atlassian servers show "Failed to connect":

1. Open Docker Desktop from Applications
2. Wait for the Docker daemon to fully start (whale icon stops animating)
3. Run `claude mcp list` to verify connection

## Project-Specific Isolation (Future)

If you later need to isolate environment variables per project (e.g., working on multiple projects with different Atlassian instances), consider using:

- **direnv** - Automatically loads/unloads project-specific variables
- **Project-prefixed names** - Use `FFP_JIRA_URL` instead of `JIRA_URL`

## Additional Resources

- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [Model Context Protocol Specification](https://github.com/modelcontextprotocol/specification)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
