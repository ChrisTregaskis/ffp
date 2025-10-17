# Sprint Planning Checklist

Track your progress through the sprint planning process.

---

## Chat 1: Define Ticket Standards

- [ ] Copy prompt from `chat-1-prompt.md`
- [ ] Start new Claude chat (fresh tokens)
- [ ] Paste prompt and run
- [ ] Review generated standards
- [ ] Save output to `outputs/jira-ticket-standards.md`
- [ ] Verify all 5 ticket types covered (Epic, Story, Task, Subtask, Bug)
- [ ] Check Jira field mappings included
- [ ] Review story point reference table

**Notes:**
_Add any adjustments or clarifications needed here_

---

## Chat 2: Create Epics in Jira

- [ ] Copy prompt from `chat-2-prompt.md`
- [ ] Start new Claude chat (fresh tokens)
- [ ] Paste prompt and run
- [ ] Claude creates 6 Epics in Jira
- [ ] Verify Epic keys returned (e.g., SCRUM-1 through SCRUM-6)
- [ ] Check Epics in Jira: `https://ctregaskis.atlassian.net/browse/SCRUM`
- [ ] Save summary doc to `outputs/epics-created-summary.md`
- [ ] Copy Epic URLs for reference

**Epic Keys Created:**

- [ ] Sprint 1 (Application Setup): SCRUM-\_\_\_\_
- [ ] Sprint 2 (Assessment Engine): SCRUM-\_\_\_\_
- [ ] Sprint 3 (Video Management): SCRUM-\_\_\_\_
- [ ] Sprint 4 (User Dashboards): SCRUM-\_\_\_\_
- [ ] Sprint 5 (Business Portal): SCRUM-\_\_\_\_
- [ ] Sprint 6 (Company Management): SCRUM-\_\_\_\_

---

## Chat [E1]: Create Stories for Sprint 1

- [ ] Create prompt referencing Sprint 1 Epic key
- [ ] Start new Claude chat
- [ ] Claude creates Stories linked to Sprint 1 Epic
- [ ] Verify Stories created in Jira
- [ ] Check parent-child links work
- [ ] Save summary doc to `outputs/sprint-1-stories-created.md`
- [ ] Count stories created: \_\_\_\_

**Story Keys Created:**
_List them as created: SCRUM-7, SCRUM-8, etc._

---

## Chat [E2-E6]: Create Stories for Remaining Sprints

### Sprint 2: Assessment Engine Core

- [ ] Create Stories
- [ ] Verify in Jira
- [ ] Save summary doc
- [ ] Story count: \_\_\_\_

### Sprint 3: Video Management & Streaming

- [ ] Create Stories
- [ ] Verify in Jira
- [ ] Save summary doc
- [ ] Story count: \_\_\_\_

### Sprint 4: User Dashboards & Progress

- [ ] Create Stories
- [ ] Verify in Jira
- [ ] Save summary doc
- [ ] Story count: \_\_\_\_

### Sprint 5: Business Portal

- [ ] Create Stories
- [ ] Verify in Jira
- [ ] Save summary doc
- [ ] Story count: \_\_\_\_

### Sprint 6: Company Management Portal

- [ ] Create Stories
- [ ] Verify in Jira
- [ ] Save summary doc
- [ ] Story count: \_\_\_\_

---

## Chat [US-Sprint1-Batch1]: Add Details to Sprint 1 Stories

- [ ] Select 3-5 Sprint 1 stories for detail pass
- [ ] Create prompt with story keys
- [ ] Start new Claude chat
- [ ] Claude updates stories with full acceptance criteria
- [ ] Verify updates in Jira
- [ ] Save update log

**Stories Detailed:**

- [ ] SCRUM-\__\_\_: \_Story title_
- [ ] SCRUM-\__\_\_: \_Story title_
- [ ] SCRUM-\__\_\_: \_Story title_
- [ ] SCRUM-\__\_\_: \_Story title_
- [ ] SCRUM-\__\_\_: \_Story title_

---

## Final Verification

### Sprint 1 Ready to Start

- [ ] All Epics created
- [ ] All Sprint 1 Stories created
- [ ] All Sprint 1 Stories have detailed acceptance criteria
- [ ] Subtasks created where needed
- [ ] Story points estimated
- [ ] Labels applied correctly
- [ ] Dependencies noted

### Jira Board Setup

- [ ] Create Sprint 1 in Jira
- [ ] Add Sprint 1 Stories to sprint
- [ ] Set sprint start/end dates
- [ ] Configure board columns (To Do, In Progress, Done)
- [ ] Set up filters if needed

---

## Ongoing During Execution

### Daily

- [ ] Update story status in Jira
- [ ] Move cards across board
- [ ] Add comments with progress notes

### Weekly

- [ ] Review completed stories
- [ ] Adjust remaining estimates
- [ ] Update blocked status if needed

### Sprint End

- [ ] Mark sprint complete
- [ ] Review completed vs planned
- [ ] Document lessons learned
- [ ] Plan next sprint

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

- **Jira Project**: https://ctregaskis.atlassian.net/browse/SCRUM
- **Sprint Planning Docs**: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/`
- **Chat Prompts**: `sprint-planning/chat-X-prompt.md`
- **Output Docs**: `sprint-planning/outputs/`

---

**Last Updated**: October 17, 2025
