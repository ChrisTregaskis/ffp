# Jira Fields & API Reference

## Project Configuration

- **Cloud ID**: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`
- **Project Key**: `SCRUM`
- **Base URL**: `https://christophertregaskis.atlassian.net`

---

## Issue Type IDs

| Type    | ID    |
| ------- | ----- |
| Epic    | 10001 |
| Story   | 10004 |
| Task    | 10003 |
| Subtask | 10002 |
| Bug     | 10006 |

---

## Labels

| Label            | Purpose                      |
| ---------------- | ---------------------------- |
| `phase-1`        | MVP phase work (Sprints 1-6) |
| `phase-2`        | Post-MVP enhancements        |
| `frontend`       | React/UI work                |
| `backend`        | Lambda/API work              |
| `database`       | PostgreSQL work              |
| `infrastructure` | AWS/SST work                 |
| `security`       | Security-related             |
| `testing`        | Test infrastructure          |
| `multi-tenant`   | Tenant isolation work        |
| `production`     | Production issues            |
| `performance`    | Performance optimization     |
| `documentation`  | Docs updates                 |
| `refactor`       | Code refactoring             |

---

## Components

| Component            | Description         |
| -------------------- | ------------------- |
| `Authentication`     | Cognito auth system |
| `Assessment Engine`  | Assessment logic    |
| `Video Management`   | Video system        |
| `Program Generation` | Workout programs    |
| `User Dashboard`     | Individual user UI  |
| `Business Portal`    | Business account UI |
| `Company Management` | Company admin UI    |
| `Database`           | PostgreSQL schema   |
| `Infrastructure`     | AWS resources       |
| `Testing`            | Test framework      |
| `CI/CD`              | Deployment pipeline |
| `Monitoring`         | CloudWatch          |

---

## API Examples

### Create Epic

```bash
curl -X POST https://christophertregaskis.atlassian.net/rest/api/3/issue \
  -H "Authorization: Bearer $JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": { "key": "SCRUM" },
      "summary": "Epic: Application Setup",
      "description": "[Markdown content]",
      "issuetype": { "id": "10001" },
      "priority": { "name": "Highest" },
      "labels": ["phase-1", "infrastructure"],
      "customfield_10011": "Application Setup"
    }
  }'
```

### Create Story with Epic Link

```bash
curl -X POST https://christophertregaskis.atlassian.net/rest/api/3/issue \
  -H "Authorization: Bearer $JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": { "key": "SCRUM" },
      "summary": "As a new user, I want to register",
      "description": "[Markdown content]",
      "issuetype": { "id": "10004" },
      "parent": { "key": "SCRUM-1" },
      "priority": { "name": "High" },
      "labels": ["phase-1", "authentication"],
      "customfield_10016": 5
    }
  }'
```

### Create Subtask

```bash
curl -X POST https://christophertregaskis.atlassian.net/rest/api/3/issue \
  -H "Authorization: Bearer $JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": { "key": "SCRUM" },
      "summary": "Create Zod schema for registration",
      "description": "[Markdown content]",
      "issuetype": { "id": "10002" },
      "parent": { "key": "SCRUM-10" }
    }
  }'
```

### Create Bug

```bash
curl -X POST https://christophertregaskis.atlassian.net/rest/api/3/issue \
  -H "Authorization: Bearer $JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": { "key": "SCRUM" },
      "summary": "[Bug] Assessment submission fails",
      "description": "[Markdown content]",
      "issuetype": { "id": "10006" },
      "priority": { "name": "Critical" },
      "labels": ["production", "multi-tenant"]
    }
  }'
```

---

## Link Types

| Link Type      | Usage                  |
| -------------- | ---------------------- |
| **Epic Link**  | Story → Epic           |
| **Parent**     | Subtask → Story/Task   |
| **Blocks**     | Issue A blocks Issue B |
| **Relates to** | General relationship   |
| **Duplicate**  | Duplicate issues       |

---

## Custom Field IDs

| Field        | ID                |
| ------------ | ----------------- |
| Story Points | customfield_10016 |
| Epic Name    | customfield_10011 |
| Sprint       | customfield_10020 |

---

## Priority Levels

- **Highest** - Immediate attention
- **High** - Sprint priority
- **Medium** - Backlog priority
- **Low** - Nice to have
