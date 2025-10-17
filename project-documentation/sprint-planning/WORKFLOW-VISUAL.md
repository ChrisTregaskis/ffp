# Sprint Planning Workflow - Visual Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPRINT PLANNING WORKFLOW                     │
│              (Jira Direct + Token-Optimized Standards)          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ CHAT 1: Define Ticket Standards (COMPLETE ✅)                    │
├──────────────────────────────────────────────────────────────────┤
│ Input:  chat-1-prompt.md                                         │
│ Action: Claude defines Epic, Story, Task, Subtask, Bug templates │
│ Output: jira-standards/ (modular structure for token efficiency) │
│         ├── LOAD-THIS-FIRST.md (guide)                           │
│         ├── epic-standards.md                                    │
│         ├── story-standards.md                                   │
│         ├── task-standards.md                                    │
│         ├── subtask-standards.md                                 │
│         ├── bug-standards.md                                     │
│         ├── story-points.md                                      │
│         ├── definition-of-done.md                                │
│         └── jira-fields.md                                       │
│ Time:   ~10 minutes                                              │
│ Tokens: Saves 11,000+ tokens per future chat                     │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ CHAT 2: Create Sprint 1 Epic + Stories                           │
├──────────────────────────────────────────────────────────────────┤
│ Input:  chat-2-prompt.md                                         │
│         + Load: epic-standards.md, story-standards.md            │
│ Action: Claude creates Epic + Stories via Jira API               │
│ Output: SCRUM-1 (Epic) + SCRUM-2 through N (Stories) in Jira     │
│         sprint-1-created-summary.md (reference doc)              │
│ Time:   ~20 minutes                                              │
│ Tokens: ~6,000 (vs 17,000 with old monolithic file)              │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ CHAT 3-7: Create Remaining Sprints                               │
├──────────────────────────────────────────────────────────────────┤
│ One chat per sprint (2-6)                                        │
│ Load: epic-standards.md, story-standards.md                      │
│ Creates: Epic + Stories for each sprint                          │
│ Output: sprint-N-created-summary.md per sprint                   │
│ Time:   ~15 minutes per sprint                                   │
│ Tokens: ~6,000 per chat (modular loading)                        │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ CHAT [US]: Add Details to Stories (As Needed)                    │
├──────────────────────────────────────────────────────────────────┤
│ Input:  Story keys to update                                     │
│         + Load: story-standards.md, subtask-standards.md         │
│ Action: Claude adds acceptance criteria, subtasks via API        │
│ Output: Updated Jira stories + update log                        │
│ Time:   ~10 minutes per batch of 3-5 stories                     │
│ Tokens: ~4,500 (load only what you need)                         │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ JIRA BOARD SETUP                                                 │
├──────────────────────────────────────────────────────────────────┤
│ • Create Sprint 1 in Jira                                        │
│ • Add Stories to sprint                                          │
│ • Configure board columns                                        │
│ • Ready to start development!                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## File Flow Diagram (Updated)

```
sprint-planning/
│
├── chat-1-prompt.md ───────────┐
├── chat-2-prompt.md            │
├── chat-3-prompt.md            ├─── Prompts
├── ...                         │    (What to ask Claude)
│                               │
├── README.md                   │
├── CHECKLIST.md                │
├── workflow-visual.md          ├─── Reference Docs
├── jira-integration-ref.md     │    (How it works)
├── SETUP-COMPLETE.md ──────────┘
│
├── jira-standards/ ◄──────────────── MODULAR STRUCTURE (Token-Optimized)
│   │
│   ├── LOAD-THIS-FIRST.md (~500 tokens) ◄── START HERE per chat
│   ├── README.md (~500 tokens)           ◄── Index/guide
│   │
│   ├── epic-standards.md (~2,500 tokens)    ◄── Load for Epic creation
│   ├── story-standards.md (~3,000 tokens)   ◄── Load for Story creation
│   ├── task-standards.md (~2,000 tokens)    ◄── Load for Task creation
│   ├── subtask-standards.md (~1,500 tokens) ◄── Load for Subtask creation
│   ├── bug-standards.md (~2,500 tokens)     ◄── Load for Bug triage
│   │
│   ├── story-points.md (~1,000 tokens)      ◄── Estimation reference
│   ├── definition-of-done.md (~1,000 tokens)◄── DoD checklists
│   └── jira-fields.md (~1,500 tokens)       ◄── Labels, components, API
│
└── outputs/
    │
    ├── jira-ticket-standards-ARCHIVED.md ◄── Original monolithic (17k tokens)
    │                                         Now archived, use modular instead
    │
    ├── sprint-1-created-summary.md ◄── Created by Chat 2
    ├── sprint-2-created-summary.md ◄── Created by Chat 3
    ├── sprint-3-created-summary.md ◄── Created by Chat 4
    ├── ...                           (And so on)
    │
    └── sprint-1-stories-updated-batch-1.md ◄── Created by Chat [US]
```

---

## Token Optimization Strategy

```
OLD WAY (Monolithic):
┌────────────────────────────────────┐
│ jira-ticket-standards.md           │
│ (17,000 tokens - EVERYTHING)       │
│                                    │
│ Load for EVERY chat = WASTEFUL     │
└────────────────────────────────────┘

NEW WAY (Modular):
┌────────────────────────────────────┐
│ Load ONLY what you need per chat:  │
│                                    │
│ Epic planning:                     │
│   └─ epic-standards.md (2,500)     │
│                                    │
│ Story planning:                    │
│   ├─ story-standards.md (3,000)    │
│   └─ story-points.md (1,000)       │
│      = 4,000 tokens                │
│                                    │
│ Task creation:                     │
│   └─ task-standards.md (2,000)     │
│                                    │
│ SAVINGS: 65-88% per chat! ✨       │
└────────────────────────────────────┘
```

### Token Usage Comparison

| Chat Type           | Old (Monolithic) | New (Modular) | Savings    |
| ------------------- | ---------------- | ------------- | ---------- |
| **Epic Planning**   | 17,000           | 2,500         | **85%** ✨ |
| **Story Planning**  | 17,000           | 4,000         | **76%** ✨ |
| **Sprint Planning** | 17,000           | 6,000         | **65%** ✨ |
| **Task Creation**   | 17,000           | 2,000         | **88%** ✨ |
| **Bug Triage**      | 17,000           | 2,500         | **85%** ✨ |

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
│  ├── jira-standards/ (MODULAR - load selectively)           │
│  │   ├── Templates per ticket type                          │
│  │   ├── Examples for FFP project                           │
│  │   └── Quick references                                   │
│  └── outputs/                                               │
│      └── Summary docs (links to Jira)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Claude reads prompts
                    + loads ONLY needed standards
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
├── Day 1: Chat 1 (Standards) ✅ COMPLETE       [~30 min, ~6k tokens]
├── Day 1: Chat 2 (Sprint 1)                    [~30 min, ~6k tokens]
├── Day 2: Chat 3-7 (Sprints 2-6)               [~2 hours, ~6k tokens each]
├── Day 3: Chat [US] (Add details as needed)    [~2 hours, ~4.5k tokens/batch]
└── Day 4: Jira board setup + review            [~1 hour]

Week 2+: Development
├── Daily standups (5-10 min)
├── Update Jira as you work
├── Sprint reviews at end
└── Retrospectives
```

---

## Success Metrics

After planning complete, you should have:

✅ **Standards**: Modular, token-optimized structure (jira-standards/)  
✅ **6 Epics**: One per sprint in Jira (SCRUM-1 through SCRUM-6)  
✅ **~50-80 Stories**: Across all sprints  
✅ **Sprint 1 detailed**: Ready to start development  
✅ **Dependencies mapped**: Know what blocks what  
✅ **Estimates done**: Story points assigned  
✅ **Token efficiency**: 65-88% reduction per chat

---

## Quick Reference

| What                  | Where                                |
| --------------------- | ------------------------------------ |
| Prompts               | `sprint-planning/chat-X-prompt.md`   |
| Standards (Modular)   | `jira-standards/` (load selectively) |
| Standards Guide       | `jira-standards/LOAD-THIS-FIRST.md`  |
| Actual work items     | Jira SCRUM project                   |
| Progress tracking     | Jira board + CHECKLIST.md            |
| Sprint retrospectives | Update project-state.md              |

---

## Module Loading Guide (Quick Ref)

**For Chat 2 (Sprint 1 Planning):**

```
Load: jira-standards/epic-standards.md
      jira-standards/story-standards.md
      jira-standards/story-points.md
Total: ~6,000 tokens
```

**For Adding Subtasks:**

```
Load: jira-standards/subtask-standards.md
Total: ~1,500 tokens
```

**For Bug Triage:**

```
Load: jira-standards/bug-standards.md
Total: ~2,500 tokens
```

See `jira-standards/LOAD-THIS-FIRST.md` for complete loading guide.

---

## Emergency Quick Start

**Just want to get started NOW?**

1. ✅ Chat 1 already complete (modular standards created)
2. Copy `chat-2-prompt.md`
3. Paste in new Claude chat
4. Mention: "Load epic-standards.md, story-standards.md, story-points.md"
5. Watch Sprint 1 Epic + Stories appear in Jira
6. Continue with remaining sprints

**That's it!** 🚀

---

**Last Updated**: October 17, 2025  
**Version**: 2.0 (Token-Optimized)
