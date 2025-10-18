# Sprint Planning Prompts

This directory contains prompt templates for creating Jira issues during FFP sprint planning.

## File Overview

| File                           | Purpose                            | When to Use                    |
| ------------------------------ | ---------------------------------- | ------------------------------ |
| `chat-e1-sprint-1-stories.md`  | Create User Stories for Sprint 1   | After Epics are created        |
| `chat-s1-template-subtasks.md` | Create Subtasks for any User Story | After User Stories are created |

## Usage

### Creating User Stories (Chat E1)

1. **Open a new Claude conversation**
2. **Load the prompt**: Copy content from `chat-e1-sprint-1-stories.md`
3. **Paste into Claude**: Start conversation with the full prompt
4. **Claude will**:
   - Create 8-10 User Stories in Jira for Sprint 1
   - Link all stories to FFP-1 Epic
   - Estimate story points
   - Generate summary document

### Creating Subtasks (Chat S1)

1. **After User Stories exist in Jira**
2. **Open a new Claude conversation**
3. **Load the prompt**: Copy content from `chat-s1-template-subtasks.md`
4. **Modify with specifics**:
   - Replace `[Story Key]` with actual story (e.g., FFP-7)
   - Add story context
5. **Paste into Claude**: Start conversation
6. **Claude will**:
   - Create 3-8 Subtasks for the User Story
   - Link all subtasks to parent story
   - Estimate time per subtask
   - Generate subtask summary

## Pattern for Remaining Sprints

### Sprint 2 (FFP-2): Assessment Engine

Copy `chat-e1-sprint-1-stories.md` and update:

- Epic Link: FFP-2
- Sprint number: Sprint 2
- Story scope: From FFP-2 Epic description

### Sprint 3-6: Similar Pattern

Repeat for each Epic (FFP-3 through FFP-6)

## Timeline Context

**Developer Capacity**: 8 hours/week (part-time with full-time job + family)

**Sprint Durations**:

- Sprint 1 (34 points): 8-10 weeks
- Sprint 2 (34 points): 8-10 weeks
- Sprint 3 (21 points): 5-6 weeks
- Sprint 4 (21 points): 5-6 weeks
- Sprint 5 (21 points): 5-6 weeks
- Sprint 6 (13 points): 3-4 weeks

**Total**: ~9-12 months for Phase 1 MVP

## Jira Configuration

**Cloud ID**: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`  
**Site**: https://ctregaskis.atlassian.net  
**Project**: FFP

**Issue Type IDs**:

- Epic: `10011`
- Story: `10010`
- Subtask: `10012`

## Related Documentation

- `../jira-standards/epic-standards.md` - Epic template
- `../jira-standards/story-standards.md` - Story template
- `../jira-standards/story-points.md` - Estimation guidelines
- `../outputs/epics-created-summary.md` - Epic creation summary

## Tips

### For Better Story Creation

- Reference project documentation before creating stories
- Include specific technical details from docs
- Always add multi-tenant isolation tests
- Keep acceptance criteria clear and testable

### For Better Subtask Creation

- Break down into 1-4 hour chunks
- Include clear acceptance criteria per subtask
- Add "Definition of Done" checklist
- Order subtasks by dependency
- Include testing and documentation subtasks

### For Realistic Estimation

- 1 story point ≈ 1 week of work (8 hours)
- 8-point story ≈ 8 weeks (2 months) of work
- Account for learning curve on new technologies
- Factor in testing and documentation time

## Status

- ✅ Chat 2 Complete: All 6 Epics created (FFP-1 through FFP-6)
- 🔄 Next: Chat E1 - Create User Stories for Sprint 1
- ⏳ Pending: Subtask creation (after User Stories)

---

**Last Updated**: October 17, 2025  
**Created By**: Claude (AI Assistant)  
**Project**: FFP - Fit For Purpose
