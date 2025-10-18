# 🎯 Quick Reference - Load This First!

## Token-Optimised Jira Standards

Standards broken into focused modules. **Load only what you need per chat.**

---

## 📝 File Naming Convention

All files in `outputs/` and `prompts/` follow this format:

```
yyyy-mm-dd_hhmm_descriptive-name.md
```

**Examples:**

- `2025-10-18_1505_FFP-13-rescope-summary.md`
- `2025-10-18_1400_sprint-1-stories-summary.md`
- `2025-10-17_2200_chat-e1-sprint-1-stories`

**Purpose:**

- Chronological sorting in file explorer
- Clear timestamp for version tracking
- Easy identification of latest outputs
- Supports future file archival strategies

**Exception:** Core reference files without dates:

- `sprint-1-stories-quick-ref.md` (living document)
- Standard templates in `jira-standards/`

---

## 📊 Module Loading Guide

### For Sprint 1 Planning (Chat 2)

```
Load: epic-standards.md + story-standards.md + story-points.md
Token Cost: ~6,000 tokens (saves 11,000 vs original)
```

### For Daily Story Creation

```
Load: story-standards.md + story-points.md
Token Cost: ~3,500 tokens (saves 13,500 vs original)
```

### For Task Creation

```
Load: task-standards.md
Token Cost: ~2,000 tokens (saves 15,000 vs original)
```

### For Bug Triage

```
Load: bug-standards.md
Token Cost: ~2,500 tokens (saves 14,500 vs original)
```

---

## 📁 File Structure

```
jira-standards/
├── README.md                    (500 tokens) - This file
├── epic-standards.md            (2,500 tokens)
├── story-standards.md           (3,000 tokens)
├── task-standards.md            (2,000 tokens)
├── subtask-standards.md         (1,500 tokens)
├── bug-standards.md             (2,500 tokens)
├── story-points.md              (1,000 tokens)
├── definition-of-done.md        (1,000 tokens)
└── jira-fields.md               (1,500 tokens)
```

**Original monolithic file**: 17,000+ tokens (ARCHIVED)

---

## 🚀 Quick Start

1. **Read this file first** (you're here!)
2. **Load relevant module(s)** based on chat context
3. **Cross-reference** if you need additional detail

---

## 💰 Token Savings

| Chat Type            | Old Cost | New Cost | Savings |
| -------------------- | -------- | -------- | ------- |
| Epic Planning        | 17,000   | 2,500    | 85%     |
| Story Planning       | 17,000   | 3,500    | 79%     |
| Task Creation        | 17,000   | 2,000    | 88%     |
| Bug Triage           | 17,000   | 2,500    | 85%     |
| Full Sprint Planning | 17,000   | 6,000    | 65%     |

---

## 📚 Module Descriptions

**Core Standards:**

- `epic-standards.md` - Epic template, 2 examples
- `story-standards.md` - Story template, AC format, 2 examples
- `task-standards.md` - Task template, 2 examples
- `subtask-standards.md` - Subtask template, 2 examples
- `bug-standards.md` - Bug template, severity, 2 examples

**References:**

- `story-points.md` - Fibonacci scale, estimation examples
- `definition-of-done.md` - DoD checklists per type
- `jira-fields.md` - Labels, components, API examples

---

## 🎯 Next: Chat 2 (Sprint 1 Planning)

For Sprint 1 planning, load:

- `epic-standards.md` (for Sprint 1 epic)
- `story-standards.md` (for Sprint 1 stories)
- `story-points.md` (for estimation)

**Estimated token cost**: ~6,000 tokens

---

**Path**: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/jira-standards/`
