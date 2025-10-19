# Sprint Planning Checklist

Track your progress through the sprint planning process.

---

## Chat 1: Define Ticket Standards

- [x] Copy prompt from `chat-1-prompt.md`
- [x] Start new Claude chat (fresh tokens)
- [x] Paste prompt and run
- [x] Review generated standards
- [x] Save output to `outputs/jira-ticket-standards.md`
- [x] Verify all 5 ticket types covered (Epic, Story, Task, Subtask, Bug)
- [x] Check Jira field mappings included
- [x] Review story point reference table

**Notes:**
_Add any adjustments or clarifications needed here_

---

## Chat 2: Create Epics in Jira

- [x] Copy prompt from `chat-2-prompt.md`
- [x] Start new Claude chat (fresh tokens)
- [x] Paste prompt and run
- [x] Claude creates 6 Epics in Jira
- [ ] Verify Epic keys returned (e.g., FFP-1 through FFP-6)
- [x] Check Epics in Jira: `https://ctregaskis.atlassian.net/browse/FFP`
- [x] Save summary doc to `outputs/epics-created-summary.md`
- [x] Copy Epic URLs for reference

**Epic Keys Created:**

- [x] Sprint 1 (Application Setup): FFP-1
- [x] Sprint 2 (Assessment Engine): FFP-2
- [x] Sprint 3 (Video Management): FFP-3
- [x] Sprint 4 (User Dashboards): FFP-4
- [x] Sprint 5 (Business Portal): FFP-5
- [x] Sprint 6 (Company Management): FFP-6

---

## Chat [E1]: Create Stories for Sprint 1

- [x] Create prompt referencing Sprint 1 Epic key
- [x] Start new Claude chat
- [x] Claude creates Stories linked to Sprint 1 Epic
- [x] Verify Stories created in Jira
- [x] Check parent-child links work
- [x] Save summary doc to `outputs/sprint-1-stories-created.md`

**Story Keys Created:**
_List them as created: FFP-7, FFP-8, etc._

---

## Chat [E2-E6]: Create Stories for Remaining Sprints

**Sprint 2: Assessment Engine Core**
**Sprint 3: Video Management & Streaming**
**Sprint 4: User Dashboards & Progress**
**Sprint 5: Business Portal**
**Sprint 6: Company Management Portal**

- [ ] Create Stories
- [ ] Verify in Jira
- [ ] Save summary doc
- [ ] Story count: \_\_\_\_

---

## Chat [US-Sprint1-Batch1]: Add Details to Sprint 1 Stories

- [x] Select 3-5 Sprint 1 stories for detail pass
- [x] Create prompt with story keys
- [x] Start new Claude chat
- [x] Claude updates stories with full acceptance criteria
- [x] Verify updates in Jira
- [x] Save update log

---

## Final Verification

### Sprint 1 Ready to Start

- [x] All Epics created
- [x] All Sprint 1 Stories created
- [x] All Sprint 1 Stories have detailed acceptance criteria
- [x] Subtasks created where needed
- [x] Story points estimated
- [x] Labels applied correctly
- [x] Dependencies noted

### Jira Board Setup

- [x] Create Sprint 1 in Jira
- [x] Add Sprint 1 Stories to sprint
- [x] Set sprint start/end dates
- [x] Configure board columns (To Do, In Progress, Done)
- [x] Set up filters if needed

---

## Common Issues

### Issue: Epic not created in Jira

**Solution**: Check error message from Claude, verify permissions, retry

### Issue: Stories not linking to Epic

**Solution**: Verify Epic key correct, check parent field in Jira

### Issue: Description formatting weird

**Solution**: Jira uses different markdown, may need manual adjustment

### Issue: Can't find created issues

**Solution**: Search by Epic key in Jira, check project filter

---

## Quick Links

- **Jira Project**: https://ctregaskis.atlassian.net/browse/FFP
- **Sprint Planning Docs**: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/`
- **Chat Prompts**: `sprint-planning/prompts/chat-X-prompt.md`
- **Output Docs**: `sprint-planning/outputs/`

---

**Last Updated**: October 17, 2025
