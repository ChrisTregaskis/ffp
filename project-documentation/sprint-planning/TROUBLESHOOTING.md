# Sprint Planning Troubleshooting Guide

Common issues and solutions when using Claude for sprint planning with Jira integration.

---

## Issue: Claude Can't Create Jira Issue

### Symptom

Error message: "Failed to create issue" or "Permission denied"

### Solutions

1. **Check Jira Permissions**

   ```bash
   # Verify you have create permission
   # In Jira: Settings > Projects > SCRUM > Permissions
   ```

   - Need: "Create Issues" permission
   - Need: "Edit Issues" permission (for updates)

2. **Verify Cloud ID**

   - Should be: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`
   - Check in prompt file

3. **Check Project Key**

   - Should be: `SCRUM` (uppercase)
   - Not: `scrum` or `FFP`

4. **Verify Issue Type IDs**
   - Epic: 10001
   - Story: 10004
   - Task: 10003
   - Subtask: 10002
   - Bug: 10006

---

## Issue: Story Not Linking to Epic

### Symptom

Story created but not showing under Epic in Jira

### Solutions

1. **Check Parent Field**

   ```javascript
   // Correct format
   additional_fields: {
     parent: {
       key: "SCRUM-1";
     } // Not "id"
   }
   ```

2. **Verify Epic Key**

   - Must use exact key from Jira (e.g., SCRUM-1)
   - Check Epic exists before creating Story

3. **Check Issue Hierarchy**
   - Stories can link to Epics (✅)
   - Tasks cannot link to Epics (❌)
   - Subtasks link to Stories/Tasks (✅)

---

## Issue: Description Formatting Looks Wrong

### Symptom

Markdown not rendering properly in Jira

### Cause

Jira uses Confluence-flavored markdown, slightly different from standard markdown

### Solutions

1. **Headers**

   ```markdown
   # Header 1 ✅

   ## Header 2 ✅

   ### Header 3 ✅
   ```

2. **Lists**

   ```markdown
   - Item 1 ✅
   - Item 2 ✅
     - Nested ✅

   1. Numbered ✅
   2. List ✅
   ```

3. **Code Blocks**

   ````markdown
   ```javascript ✅
   code here
   ```
   ````

   ```

   ```

4. **Links**

   ```markdown
   [Link text](https://url.com) ✅
   ```

5. **Bold/Italic**
   ```markdown
   **bold** ✅
   _italic_ ✅
   ```

**Workaround**: If formatting critical, manually edit in Jira after creation

---

## Issue: Can't Find Created Issues

### Symptom

Claude says issues created but can't see them in Jira

### Solutions

1. **Check Project Filter**

   - In Jira, ensure viewing SCRUM project
   - Remove any custom filters

2. **Search by Key**

   ```
   Navigate to: https://ctregaskis.atlassian.net/browse/SCRUM-X
   (Replace X with issue number)
   ```

3. **Use JQL Search**

   ```
   project = SCRUM AND created >= -1d
   ```

4. **Check All Issues**
   - Click "View All Issues" in project sidebar
   - Sort by "Created" descending

---

## Issue: Chat Running Out of Tokens

### Symptom

Claude stops responding or truncates output

### Solutions

1. **Start Fresh Chat**

   - Each major step in new chat
   - Copy prompt, paste, run
   - Don't continue long conversations

2. **Batch Operations**

   - Create 3-5 Stories at a time
   - Don't try all sprints in one chat

3. **Use Summary Docs**
   - Reference previous outputs via files
   - Don't paste long histories into chat

---

## Issue: Story Points Not Showing

### Symptom

Story points field empty in Jira

### Cause

Story points is a custom field, ID varies per Jira instance

### Solutions

1. **Find Story Points Field ID**

   ```bash
   # In Jira: Settings > Issues > Custom fields
   # Look for "Story Points" or "Estimate"
   # Note the field ID (e.g., customfield_10016)
   ```

2. **Update in Future Chats**

   ```javascript
   additional_fields: {
     customfield_10016: 5; // Your actual field ID
   }
   ```

3. **Manual Workaround**
   - Add story points manually after creation
   - Or update field ID in subsequent batch updates

---

## Issue: Subtask Not Showing Under Story

### Symptom

Subtask created but not nested under Story

### Solutions

1. **Check Parent Link**

   ```javascript
   // For Subtask creation
   additional_fields: {
     parent: {
       key: "SCRUM-7";
     } // Story key
   }
   ```

2. **Verify Issue Type**

   - Must be Subtask type (10002)
   - Not Task type

3. **Check in Jira**
   - Click Story
   - Check "Sub-tasks" section
   - May need page refresh

---

## Issue: Labels Not Applied

### Symptom

Labels field empty in created issues

### Solutions

1. **Check Label Format**

   ```javascript
   additional_fields: {
     labels: ["sprint-1", "infrastructure"]; // Array of strings
   }
   ```

2. **Label Naming Rules**
   - No spaces (use hyphens)
   - Lowercase recommended
   - Alphanumeric and hyphens only

---

## Issue: Priority Not Set

### Symptom

Priority shows as default instead of specified

### Solutions

1. **Check Priority Format**

   ```javascript
   additional_fields: {
     priority: {
       name: "High";
     } // Not "high"
   }
   ```

2. **Valid Priority Names**
   - "Highest"
   - "High"
   - "Medium"
   - "Low"
   - "Lowest"

---

## Issue: Claude Returns Error Code

### Common Error Codes

**400 Bad Request**

- Check required fields present
- Verify field formats (JSON structure)
- Check issue type ID correct

**401 Unauthorized**

- Verify Claude has Jira access
- Check Atlassian connector connected
- Re-authenticate if needed

**403 Forbidden**

- Check Jira permissions
- Verify project permissions
- Contact Jira admin if needed

**404 Not Found**

- Verify project key (SCRUM)
- Check cloud ID correct
- Ensure project exists

---

## Issue: Prompts Too Long

### Symptom

Can't copy full prompt, too many characters

### Solutions

1. **Open File Directly**

   ```bash
   # Use text editor
   code /path/to/chat-1-prompt.md
   ```

2. **Copy in Sections**

   - Copy context + objective first
   - Then copy sprint structure
   - Finally copy requirements

3. **Use Shorter Format**
   - Reference docs instead of including full text
   - Claude can read project-documentation files

---

## Issue: Need to Modify Created Issue

### Solutions

1. **Via Claude (Next Chat)**

   ```
   "Update SCRUM-7 with new acceptance criteria"
   ```

2. **Manual in Jira**

   - Navigate to issue
   - Click Edit
   - Update fields
   - Save

3. **Batch Updates**
   - Prepare list of changes
   - Let Claude update multiple issues in one chat

---

## Prevention Tips

✅ **Before Each Chat**

- Check Jira connection active
- Verify last chat's output succeeded
- Have Epic/Story keys ready

✅ **During Chat**

- Watch for error messages
- Verify issue keys returned
- Check Jira immediately

✅ **After Chat**

- Verify all issues created
- Check links/hierarchy correct
- Save summary doc
- Update checklist

---

## Getting Help

### Check These First

1. This troubleshooting guide
2. `jira-integration-reference.md`
3. Jira project permissions
4. Recent Claude error messages

### Still Stuck?

1. Check Atlassian connector status in Claude
2. Verify Jira project accessible in browser
3. Try creating simple test issue manually
4. Check Jira system status page

---

## Common Fixes Summary

| Issue            | Quick Fix            |
| ---------------- | -------------------- |
| Can't create     | Check permissions    |
| Wrong format     | Check field IDs      |
| Not linked       | Verify parent key    |
| Can't find       | Search by key        |
| No story points  | Find custom field ID |
| Labels missing   | Check array format   |
| Subtask orphaned | Verify parent link   |
| Token limit      | Start fresh chat     |

---

**Last Updated**: October 17, 2025
