# Sprint Planning Workflow - Visual Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPRINT PLANNING WORKFLOW                      │
│                    (Jira Direct Integration)                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ CHAT 1: Define Ticket Standards                                  │
├──────────────────────────────────────────────────────────────────┤
│ Input:  chat-1-prompt.md                                         │
│ Action: Claude defines Epic, Story, Task, Subtask, Bug templates│
│ Output: jira-ticket-standards.md (saved to repo)                │
│ Time:   ~10 minutes                                              │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ CHAT 2: Create 6 Epics in Jira                                   │
├──────────────────────────────────────────────────────────────────┤
│ Input:  chat-2-prompt.md                                         │
│ Action: Claude creates Epics via Jira API                        │
│ Output: SCRUM-1 through SCRUM-6 (in Jira)                       │
│         epics-created-summary.md (reference doc)                 │
│ Time:   ~15 minutes                                              │
└──────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌────────────────────┐               ┌────────────────────┐
│  CHAT [E1-E3]      │               │  CHAT [E4-E6]      │
│  Sprints 1-3       │               │  Sprints 4-6       │
├────────────────────┤               ├────────────────────┤
│ Create Stories     │               │ Create Stories     │
│ Link to Epics      │               │ Link to Epics      │
│ In Jira            │               │ In Jira            │
└────────────────────┘               └────────────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ CHAT [US]: Add Details to Stories (Batches)                      │
├──────────────────────────────────────────────────────────────────┤
│ Input:  Story keys to update                                     │
│ Action: Claude adds acceptance criteria, subtasks                │
│ Output: Updated Jira stories + update log                        │
│ Time:   ~10 minutes per batch of 3-5 stories                    │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ JIRA BOARD SETUP                                                  │
├──────────────────────────────────────────────────────────────────┤
│ • Create Sprint 1                                                │
│ • Add Stories to sprint                                          │
│ • Configure board columns                                        │
│ • Ready to start development!                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## File Flow Diagram

```
sprint-planning/
│
├── chat-1-prompt.md ───────────┐
│                               │
├── chat-2-prompt.md ───────────┤
│                               │
├── README.md                   │
├── CHECKLIST.md                ├─── Reference Docs
├── jira-integration-ref.md     │    (Read by you)
├── SETUP-COMPLETE.md ──────────┘
│
└── outputs/
    │
    ├── jira-ticket-standards.md ◄── Created by Chat 1
    │
    ├── epics-created-summary.md ◄── Created by Chat 2
    │                                 (Links to SCRUM-1 through 6)
    │
    ├── sprint-1-stories-created.md ◄── Created by Chat [E1]
    ├── sprint-2-stories-created.md ◄── Created by Chat [E2]
    ├── ...                           (And so on)
    │
    └── sprint-1-stories-updated-batch-1.md ◄── Created by Chat [US]
```

---

## Data Flow: Where Everything Lives

```
┌─────────────────────────────────────────────────────────────┐
│                         LOCAL REPO                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  sprint-planning/                                           │
│  ├── Prompts (what to ask Claude)                           │
│  ├── Reference guides (how it works)                        │
│  └── outputs/                                               │
│      ├── Standards document                                 │
│      └── Summary docs (links to Jira)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Claude reads prompts
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      JIRA (SCRUM Project)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Epics: SCRUM-1 → SCRUM-6                                   │
│    ↓                                                        │
│  Stories: SCRUM-7, SCRUM-8, SCRUM-9...                      │
│    ↓                                                        │
│  Subtasks: Under each Story                                 │
│                                                             │
│  THIS IS YOUR SOURCE OF TRUTH!                              │
│  Work from Jira board during development                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Typical Timeline

```
Week 1: Planning (Pre-Development)
├── Day 1: Chat 1 (Standards)              [~30 min]
├── Day 1: Chat 2 (Create Epics)           [~30 min]
├── Day 2: Chat [E1] (Sprint 1 Stories)    [~1 hour]
├── Day 3: Chat [E2-E6] (Remaining Stories)[~2 hours]
├── Day 4: Chat [US] (Add details)         [~2 hours]
└── Day 5: Jira board setup + review       [~1 hour]

Week 2+: Development
├── Daily standups (5-10 min)
├── Update Jira as you work
├── Sprint reviews at end
└── Retrospectives
```

---

## Success Metrics

After planning complete, you should have:

✅ **Standards**: Reference doc in repo  
✅ **6 Epics**: One per sprint in Jira  
✅ **~50-80 Stories**: Across all sprints  
✅ **Sprint 1 detailed**: Ready to start development  
✅ **Dependencies mapped**: Know what blocks what  
✅ **Estimates done**: Story points assigned

---

## Quick Reference

| What                  | Where                              |
| --------------------- | ---------------------------------- |
| Prompts               | `sprint-planning/chat-X-prompt.md` |
| Standards             | `outputs/jira-ticket-standards.md` |
| Actual work items     | Jira SCRUM project                 |
| Progress tracking     | Jira board + CHECKLIST.md          |
| Sprint retrospectives | Update project-state.md            |

---

## Emergency Quick Start

**Just want to get started NOW?**

1. Copy `chat-1-prompt.md`
2. Paste in new Claude chat
3. Save output
4. Copy `chat-2-prompt.md`
5. Paste in new Claude chat
6. Watch Epics appear in Jira
7. Continue with Story creation

**That's it!** 🚀
