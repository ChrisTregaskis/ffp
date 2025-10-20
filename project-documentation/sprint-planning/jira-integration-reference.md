# Jira Integration Reference

**Last Updated**: October 17, 2025

---

## Jira Project Details

- **Site**: `https://ctregaskis.atlassian.net`
- **Project**: FFP (Fit For Purpose)
- **Project Key**: `FFP`
- **Cloud ID**: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`
- **Issue Types Available**:
  - Epic (10011)
  - Story (10010)
  - Task (10008)
  - Subtask (10012)
  - Bug (10006)

---

## Available Issue Types

| Type    | ID    | Hierarchy Level | Usage                                   |
| ------- | ----- | --------------- | --------------------------------------- |
| Epic    | 10011 | 1               | Sprint-level container                  |
| Story   | 10010 | 0               | User-facing functionality               |
| Task    | 10008 | 0               | Technical work                          |
| Subtask | 10012 | -1              | Breakdown of Stories/Tasks              |
| Bug     | 10006 | 0               | Defects and issues                      |
| Feature | 10005 | 0               | Available but not used in our structure |

---

## How Claude Creates Jira Issues

### Example: Create an Epic

```javascript
// Claude will use this API call internally
createJiraIssue({
  cloudId: '46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf',
  projectKey: 'FFP',
  issueTypeName: 'Epic',
  summary: 'Sprint 1: Application Setup',
  description: 'Epic description in markdown format...',
  additional_fields: {
    labels: ['sprint-1', 'infrastructure', 'setup'],
    priority: { name: 'High' },
  },
});
```

**Result**: Epic created with key like `FFP-1`

---

### Example: Create a Story Linked to Epic

```javascript
// Claude creates story and links to parent Epic
createJiraIssue({
  cloudId: '46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf',
  projectKey: 'FFP',
  issueTypeName: 'Story',
  summary: 'Set up Turborepo monorepo structure',
  description: 'User story description...',
  additional_fields: {
    parent: { key: 'FFP-1' }, // Links to Epic
    labels: ['sprint-1', 'monorepo'],
    priority: { name: 'High' },
    customfield_10016: 5, // Story points (if field exists)
  },
});
```

**Result**: Story created with key like `FFP-7`, linked to Epic `FFP-1`

---

### Example: Update Existing Story

```javascript
// Claude updates story with more details
editJiraIssue({
  cloudId: '46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf',
  issueIdOrKey: 'FFP-7',
  fields: {
    description: 'Updated description with acceptance criteria...',
    labels: ['sprint-1', 'monorepo', 'turborepo'],
  },
});
```

---

## Issue Hierarchy in FFP

```
Epic (Sprint-level)
├── Story (User-facing feature)
│   ├── Subtask (Implementation detail)
│   └── Subtask (Testing)
├── Task (Technical work)
│   └── Subtask (Setup step)
└── Story (Another feature)
    └── Subtask (Documentation)
```

---

## Workflow for Chat Sessions

### Chat 2: Create Epics

1. Claude creates 6 Epics via API
2. Returns Epic keys (e.g., FFP-1, FFP-2, etc.)
3. Generates summary markdown with links
4. You verify in Jira web interface

### Chat [E1]: Create Stories for Sprint 1

1. Claude retrieves Epic FFP-1
2. Creates Stories linked to FFP-1
3. Returns Story keys
4. Generates summary doc

### Chat [US]: Add Details to Stories

1. Claude retrieves existing Stories
2. Updates descriptions with full acceptance criteria
3. Creates Subtasks if needed
4. Generates update log

---

## Verification Steps

After each chat creating issues:

1. **Check Jira**: Visit `https://ctregaskis.atlassian.net/browse/FFP`
2. **Verify Count**: Confirm expected number of issues created
3. **Check Hierarchy**: Ensure Stories linked to correct Epic
4. **Review Content**: Check descriptions formatted correctly
5. **Confirm Labels**: Verify tags applied correctly

---

## Troubleshooting

### Issue Not Created

- Check Claude's response for error messages
- Verify permissions in Jira
- Check project key spelling (FFP)

### Description Formatting Issues

- Jira uses Confluence markdown
- Some advanced markdown may not render
- Check created issue and adjust if needed

### Missing Custom Fields

- Story points field may need configuration
- Sprint field added when creating sprint
- Custom fields can be added later manually

---

## Benefits of Direct Jira Integration

✅ **No manual data entry**: Claude creates issues directly  
✅ **Immediate visibility**: View in Jira instantly  
✅ **Proper hierarchy**: Stories automatically linked to Epics  
✅ **Searchable**: All issues indexed in Jira search  
✅ **Team collaboration**: Share Jira board with others (future)  
✅ **Sprint tracking**: Move issues through workflow

---

## Next Steps

1. Start Chat 1 to define standards (generates markdown reference)
2. Start Chat 2 to create 6 Epics in Jira
3. Verify Epics created successfully
4. Continue with Story creation for each Epic
