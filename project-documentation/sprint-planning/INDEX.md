# Sprint Planning - Complete Documentation Index

**Last Updated**: October 17, 2025  
**Status**: Ready to begin sprint planning

---

## 📋 Quick Start

**New to this workflow?** Read in this order:

1. Read worflow visual - `project-documentation/sprint-planning/jira-integration-reference.md`
2. Read jira integration - `project-documentation/sprint-planning/jira-integration-reference.md`

---

## 📁 Directory Structure

Structure and workflow can be found in `project-documentation/sprint-planning/workflow-visual.md`.

---

## 📚 Document Purposes

### Getting Started

**SETUP-COMPLETE.md**

- What's been created
- Key changes vs original plan
- Sprint 1 confirmed scope
- Next action to take
- **Read this first!**

**README.md**

- Complete chat flow guide
- How to use each prompt
- Output locations
- Tips for success

---

### Jira Standards (Reference for Story/Task Creation)

**jira-standards/LOAD-THIS-FIRST.md**

- Overview of standards structure
- What to load for different ticket types
- Quick reference guide

**jira-standards/story-standards.md**

- User story format and structure
- Acceptance criteria templates
- Story point guidance

**jira-standards/subtask-standards.md**

- Subtask breakdown patterns
- Implementation, testing, documentation templates
- Naming conventions

**jira-standards/definition-of-done.md**

- Completion criteria for stories
- Quality gates
- Review checklist

**Other standards**: epic, task, bug templates available as needed

---

### Reference Docs

**jira-integration-reference.md**

- Jira project details
- Available issue types
- How Claude creates issues
- Example API calls
- Issue hierarchy in FFP
- Verification steps

**workflow-visual.md**

- Visual workflow diagram
- File flow diagram
- Data flow: where things live
- Typical timeline
- Success metrics
- Emergency quick start

**troubleshooting.md**

- Common issues & solutions
- Error codes explained
- Jira formatting tips
- Prevention tips
- Quick fixes table

---

## 🎯 Workflow Summary

### General Workflow (Per Epic)

For each epic in the FFP project, follow this pattern:

```
1. Select an Epic to work on (e.g., FFP-1)
   ↓
2. Create User Stories for that Epic
   - Reference jira-standards/LOAD-THIS-FIRST.md
   - Reference jira-standards/story-standards.md
   - Use jira-integration-reference.md for API examples
   ↓
3. Add detailed acceptance criteria to Stories
   - Update descriptions with full requirements
   - Reference definition-of-done.md
   ↓
4. Create Subtasks for implementation, testing, documentation
   - Reference jira-standards/subtask-standards.md
   - Break down complex stories into manageable tasks
   ↓
5. Save summary → outputs/epic-{N}-stories-created.md
   ↓
6. Verify in Jira and move to next Epic
   ↓
7. Repeat for remaining Epics
```

---

## 🔗 Quick Links

### External

- **Jira Project**: https://ctregaskis.atlassian.net/browse/FFP
- **Jira Board**: https://ctregaskis.atlassian.net/jira/software/projects/FFP/boards

### Local Paths

```bash
# Sprint planning docs
project-documentation/sprint-planning/

# Jira Standards (templates)
sprint-planning/jira-standards/LOAD-THIS-FIRST.md
sprint-planning/jira-standards/story-standards.md
sprint-planning/jira-standards/subtask-standards.md
sprint-planning/jira-standards/definition-of-done.md

# References
sprint-planning/jira-integration-reference.md
sprint-planning/workflow-visual.md

# Outputs (generated summaries)
sprint-planning/outputs/

# Prompts (saved for reference)
sprint-planning/prompts/
```

---

## 🎓 Key Concepts

### Jira Integration

- Claude creates issues directly via API
- No manual data entry needed
- Reference docs saved to repo
- Actual work tracked in Jira

---

## 🚨 Important Notes

1. **Start fresh chats**: Each prompt in new Claude conversation
2. **Verify Jira**: Check issues created after each chat
3. **Save outputs**: Reference docs to `outputs/` folder
4. **Get help**: troubleshooting.md for common issues

---
