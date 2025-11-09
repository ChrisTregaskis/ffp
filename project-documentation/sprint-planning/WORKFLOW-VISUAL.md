# Sprint Planning Workflow - Visual Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPRINT PLANNING WORKFLOW                     │
│              (Jira Direct + Token-Optimised Standards)          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PHASE 1: Standards & Sprint 1 (COMPLETE ✅)                      │
├──────────────────────────────────────────────────────────────────┤
│ ✅ Ticket standards defined (jira-standards/)                    │
│ ✅ 6 Epics created (FFP-1 through FFP-6)                         │
│ ✅ Sprint 1 (FFP-1) user stories created                         │
│ ✅ Sprint 1 subtasks created                                     │
│ ✅ Sprint 1 development mostly complete                          │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 2: Create User Stories for Remaining Epics (CURRENT)       │
├──────────────────────────────────────────────────────────────────┤
│ FOR EACH EPIC (FFP-2 through FFP-6):                             │
│                                                                  │
│ Input:  Epic key (e.g., FFP-2)                                   │
│         + Load: story-standards.md, definition-of-done.md        │
│ Action: Create user stories for the epic                         │
│         - Write detailed acceptance criteria                     │
│         - Assign story points                                    │
│         - Link stories to epic                                   │
│ Output: Stories in Jira (e.g., FFP-20, FFP-21, etc.)             │
│         epic-{N}-stories-summary.md in outputs/                  │
│ Time:   ~20-30 minutes per epic                                  │
│ Tokens: ~4,000-5,000 per epic                                    │
│                                                                  │
│ Repeat for each remaining epic (5 total)                         │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 3: Create Subtasks for User Stories (PER EPIC)             │
├──────────────────────────────────────────────────────────────────┤
│ FOR EACH EPIC'S STORIES:                                         │
│                                                                  │
│ Input:  Story keys from an epic (e.g., FFP-20, FFP-21, FFP-22)   │
│         + Load: subtask-standards.md                             │
│ Action: Create subtasks for each story                           │
│         - Implementation subtasks                                │
│         - Testing subtasks                                       │
│         - Documentation subtasks                                 │
│ Output: Subtasks in Jira under each story                        │
│         epic-{N}-subtasks-summary.md in outputs/                 │
│ Time:   ~15-20 minutes per epic                                  │
│ Tokens: ~2,000-3,000 per epic                                    │
│                                                                  │
│ Repeat for each epic's stories (5 total)                         │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 4: Ready for Development                                   │
├──────────────────────────────────────────────────────────────────┤
│ • All epics have user stories                                    │
│ • All stories have subtasks                                      │
│ • Work from Jira board during sprints                            │
│ • Update stories/subtasks as needed during development           │
└──────────────────────────────────────────────────────────────────┘
```

---

## File Flow Diagram (Current Workflow)

```
sprint-planning/
│
├── README.md                    │
├── index.md                     │
├── workflow-visual.md           ├─── Reference Docs
├── jira-integration-reference.md│   (How the workflow works)
│                                │
├── jira-standards/ ◄──────────────── MODULAR STRUCTURE (Token-Optimised)
│   │                                  Load selectively per chat
│   │
│   ├── LOAD-THIS-FIRST.md (~500 tokens)     ◄── START HERE per chat
│   ├── README.md (~500 tokens)               ◄── Index/guide
│   │
│   ├── epic-standards.md (~2,500 tokens)     ◄── Epic creation (done)
│   ├── story-standards.md (~3,000 tokens)    ◄── Story creation (CURRENT)
│   ├── task-standards.md (~2,000 tokens)     ◄── Task creation
│   ├── subtask-standards.md (~1,500 tokens)  ◄── Subtask creation (NEXT)
│   ├── bug-standards.md (~2,500 tokens)      ◄── Bug triage
│   │
│   ├── story-points.md (~1,000 tokens)       ◄── Estimation reference
│   ├── definition-of-done.md (~1,000 tokens) ◄── DoD checklists
│   └── jira-fields.md (~1,500 tokens)        ◄── Labels, components, API
│
├── prompts/                     ◄── Saved prompts for reference
│   └── (historical prompts)
│
└── outputs/                     ◄── Generated summaries
    │
    ├── epic-1-stories-summary.md ✅ (Sprint 1 - complete)
    ├── epic-2-stories-summary.md ⏳ (Sprint 2 - create stories)
    ├── epic-2-story-subtasks-summary.md (After stories created)
    ├── epic-3-stories-summary.md ⏳ (Sprint 3 - create stories)
    ├── epic-3-story-subtasks-summary.md (After stories created)
    ├── epic-4-stories-summary.md ⏳ (Sprint 4 - create stories)
    ├── epic-4-story-subtasks-summary.md (After stories created)
    ├── epic-5-stories-summary.md ⏳ (Sprint 5 - create stories)
    ├── epic-5-story-subtasks-summary.md (After stories created)
    ├── epic-6-stories-summary.md ⏳ (Sprint 6 - create stories)
    ├── epic-6-story-subtasks-summary.md (After stories created)
    │
    └── ...
```

---

## Token Optimisation Strategy

```
CURRENT WORKFLOW (Modular):
┌────────────────────────────────────┐
│ Load ONLY what you need per chat:  │
│                                    │
│ ✅ Phase 1 (Complete):              │
│   └─ Epic + Story creation done    │
│                                    │
│ ⏳ Phase 2 (Current):              │
│   ├─ story-standards.md (3,000)    │
│   ├─ definition-of-done.md (1,000) │
│   └─ story-points.md (1,000)       │
│      = ~5,000 tokens per epic      │
│                                    │
│ ⏳ Phase 3 (Next):                 │
│   └─ subtask-standards.md (1,500)  │
│      = ~1,500 tokens per epic      │
│                                    │
│ SAVINGS: 65-88% vs monolithic! ✨  │
└────────────────────────────────────┘
```

---

## Quick Reference

| What                  | Where                                |
| --------------------- | ------------------------------------ |
| Prompts               | `sprint-planning/chat-X-prompt.md`   |
| Standards (Modular)   | `jira-standards/` (load selectively) |
| Standards Guide       | `jira-standards/LOAD-THIS-FIRST.md`  |
| Actual work items     | Jira FFP project                     |
| Progress tracking     | Jira board + CHECKLIST.md            |
| Sprint retrospectives | Update project-state.md              |

---

## Module Loading Guide (Current Workflow)

**Creating User Stories for an Epic**

```
Load: jira-standards/LOAD-THIS-FIRST.md (optional guide)
      jira-standards/story-standards.md
      jira-standards/story-points.md
      jira-standards/definition-of-done.md
Total: ~5,000 tokens

Process:
1. Review epic description and scope
2. Create user stories with detailed acceptance criteria
3. Assign story points
4. Link stories to epic
5. Save summary to outputs/epic-{N}-stories-summary.md
```

**Creating Subtasks for Stories**

```
Load: jira-standards/subtask-standards.md
Total: ~1,500 tokens

Process:
1. Review stories for an epic
2. Create implementation subtasks
3. Create testing subtasks
4. Create documentation subtasks
5. Save summary to outputs/epic-{N}-subtasks-summary.md
```

See `jira-standards/LOAD-THIS-FIRST.md` for complete loading guide.

---

**Last Updated**: November 9, 2025
**Version**: 3.0 (Post-Sprint 1 Workflow)
