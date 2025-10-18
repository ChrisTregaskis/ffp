# File Naming Convention Update

**Date**: October 18, 2025  
**Time**: 15:05  
**Change Type**: Documentation standard update

---

## New Naming Convention

All files in the following directories now use timestamped naming:

- `sprint-planning/outputs/`
- `sprint-planning/prompts/`

### Format

```
yyyy-mm-dd_hhmm_descriptive-name.md
```

### Examples

**Before:**

- `FFP-13-rescope-summary.md`
- `chat-e1-sprint-1-stories.md`
- `epics-created-summary.md`

**After:**

- `2025-10-18_1505_FFP-13-rescope-summary.md`
- `2025-10-18_0900_chat-e1-sprint-1-stories.md`
- `2025-10-18_1400_epics-created-summary.md`

---

## Benefits

1. **Chronological Sorting** - Files automatically sort by date in file explorer
2. **Version Tracking** - Clear timestamp for when output was created
3. **Audit Trail** - Easy to identify latest outputs vs historical
4. **Future Archival** - Can easily move old files to archive folders
5. **Context Clarity** - Timestamp shows when decision/output was made

---

## Exceptions

These files remain **without timestamps** (living documents):

### Core Reference Files

- `sprint-1-stories-quick-ref.md` - Actively maintained quick reference
- `sprint-1-stories-summary.md` - Living sprint summary
- Any `README.md` files

### Standard Templates

All files in `jira-standards/`:

- `epic-standards.md`
- `story-standards.md`
- `task-standards.md`
- etc.

**Rationale**: These are reference standards, not time-specific outputs.

---

## Implementation

### Files Updated

1. **LOAD-THIS-FIRST.md** ✅

   - Added "File Naming Convention" section at the top
   - Included format, examples, purpose, and exceptions
   - Placed before "Module Loading Guide" for visibility

2. **FFP-13-rescope-summary.md** ✅
   - Renamed to `2025-10-18_1505_FFP-13-rescope-summary.md`

### Files to Rename (Future)

When next editing these files, rename them:

**outputs/ directory:**

- `chat-2-completion-summary.md` → `2025-10-18_1400_chat-2-completion-summary.md`
- `epics-created-summary.md` → `2025-10-18_1200_epics-created-summary.md`
- `jira-ticket-standards.md` → `2025-10-18_1000_jira-ticket-standards.md` (or deprecate)

**prompts/ directory:**

- `chat-e1-sprint-1-stories.md` → `2025-10-17_2200_chat-e1-sprint-1-stories`
- `chat-s1-template-subtasks.md` → `2025-10-17_2230_chat-s1-template-subtasks`

**Note**: Only rename when next editing to avoid breaking existing references.

---

## Usage Guidelines

### When Creating New Files

**Always include timestamp** for:

- Chat completion summaries
- Sprint planning outputs
- Decision documents
- Rescope summaries
- Prompt templates (when saved for reference)

**Example**:

```bash
# Current datetime: October 18, 2025 15:05
# New file: 2025-10-18_1505_sprint-2-planning-kickoff.md
```

### When to Use Current Time

Use the time when:

- File is first created
- Major content change occurs (create new timestamped file)
- Decision is made (use decision time, not file creation time)

### Time Format

- **24-hour format**: `hhmm` (e.g., 1505 for 3:05 PM)
- **4 digits**: Always include leading zero (e.g., 0900, not 900)
- **No separators**: `1505` not `15:05`

---

## Benefits for Claude

1. **Context Awareness** - Timestamp shows recency of information
2. **Version Control** - Multiple versions of same doc clearly distinguishable
3. **Historical Context** - Can see evolution of decisions over time
4. **Selective Loading** - Can load specific version if needed
5. **Archive Strategy** - Old files can be easily identified for archival

---

## Benefits for Human

1. **Quick Scanning** - Chronological order in file explorer
2. **Version History** - Clear audit trail of project evolution
3. **Easy Cleanup** - Identify old files for archival
4. **Context Clarity** - Understand when decision was made
5. **Search Friendly** - Can search by date range

---

## Archive Strategy (Future)

When project grows, can archive old outputs:

```
sprint-planning/
├── outputs/
│   ├── archive/
│   │   └── 2025-10/
│   │       ├── 2025-10-18_0900_*.md
│   │       ├── 2025-10-18_1200_*.md
│   │       └── ...
│   └── [current month files]
└── prompts/
    ├── archive/
    │   └── 2025-10/
    └── [current templates]
```

**Trigger**: Monthly or when outputs/ has >20 files

---

## Documentation References

- **LOAD-THIS-FIRST.md** - Updated with naming convention
- **This file** - `2025-10-18_1505_naming-convention-update.md`

---

## Checklist for Future Files

When creating new files in `outputs/` or `prompts/`:

- [ ] Use format: `yyyy-mm-dd_hhmm_descriptive-name.md`
- [ ] Use current date and time
- [ ] Use 24-hour time format
- [ ] Include leading zeros (0900, not 900)
- [ ] Use hyphens in descriptive name
- [ ] Keep descriptive name clear and concise
- [ ] Check if file should be exception (living document)

---

**Summary**: New timestamped naming convention improves organisation, version tracking, and future archival. Applied to FFP-13 rescope summary. Core reference files remain without timestamps. Convention documented in LOAD-THIS-FIRST.md for visibility.
