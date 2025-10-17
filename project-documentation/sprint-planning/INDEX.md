# Sprint Planning - Complete Documentation Index

**Last Updated**: October 17, 2025  
**Status**: Ready to begin sprint planning

---

## 📋 Quick Start

**New to this workflow?** Read in this order:

1. **SETUP-COMPLETE.md** ← START HERE (2 min read)
2. **README.md** - Workflow overview (5 min read)
3. **chat-1-prompt.md** - Copy and run in new Claude chat
4. **CHECKLIST.md** - Track your progress

---

## 📁 Directory Structure

```
sprint-planning/
│
├── 🚀 START HERE
│   ├── SETUP-COMPLETE.md        # What's ready, next steps
│   └── README.md                # Workflow guide
│
├── 📝 PROMPTS (Copy these to Claude)
│   ├── chat-1-prompt.md         # Define ticket standards
│   └── chat-2-prompt.md         # Create 6 Epics in Jira
│
├── 📖 REFERENCES
│   ├── jira-integration-reference.md  # How Jira integration works
│   ├── WORKFLOW-VISUAL.md             # Visual diagrams
│   └── TROUBLESHOOTING.md             # Common issues & fixes
│
├── ✅ TRACKING
│   └── CHECKLIST.md             # Progress checklist
│
└── 📂 outputs/
    └── (Generated reference docs saved here)
```

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

### Prompts (Copy to Claude)

**chat-1-prompt.md**
- Defines Jira ticket standards
- Creates reference doc in repo
- ~10 minute chat
- **Run this first**

**chat-2-prompt.md**
- Creates 6 Epics in Jira
- Generates summary doc
- ~15 minute chat
- **Run after Chat 1**

**Future prompts**: Will be created as you progress
- Chat [E1-E6]: Create User Stories
- Chat [US]: Add detailed requirements

---

### Reference Docs

**jira-integration-reference.md**
- Jira project details
- Available issue types
- How Claude creates issues
- Example API calls
- Issue hierarchy in FFP
- Verification steps

**WORKFLOW-VISUAL.md**
- Visual workflow diagram
- File flow diagram
- Data flow: where things live
- Typical timeline
- Success metrics
- Emergency quick start

**TROUBLESHOOTING.md**
- Common issues & solutions
- Error codes explained
- Jira formatting tips
- Prevention tips
- Quick fixes table

---

### Tracking

**CHECKLIST.md**
- Track each chat completion
- Record Epic/Story keys
- Verification steps
- Final sprint readiness checklist
- Daily/weekly tasks during execution

---

## 🎯 Workflow Summary

```
1. Read SETUP-COMPLETE.md
   ↓
2. Copy chat-1-prompt.md → New Claude chat
   ↓
3. Save output → outputs/jira-ticket-standards.md
   ↓
4. Copy chat-2-prompt.md → New Claude chat
   ↓
5. Verify Epics in Jira (SCRUM-1 through SCRUM-6)
   ↓
6. Continue with Story creation (Chat [E1-E6])
   ↓
7. Add details to stories (Chat [US])
   ↓
8. Start development! 🚀
```

---

## 🔗 Quick Links

### External
- **Jira Project**: https://ctregaskis.atlassian.net/browse/SCRUM
- **Jira Board**: https://ctregaskis.atlassian.net/jira/software/projects/SCRUM/boards

### Local Paths
```bash
# Sprint planning docs
/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/

# Prompts
sprint-planning/chat-1-prompt.md
sprint-planning/chat-2-prompt.md

# References
sprint-planning/README.md
sprint-planning/SETUP-COMPLETE.md
sprint-planning/jira-integration-reference.md

# Outputs (generated)
sprint-planning/outputs/
```

---

## 📊 Expected Outputs

### After Chat 1
```
outputs/
└── jira-ticket-standards.md
```

### After Chat 2
```
outputs/
├── jira-ticket-standards.md
└── epics-created-summary.md
```
Plus 6 Epics in Jira: `SCRUM-1` through `SCRUM-6`

### After Story Creation
```
outputs/
├── jira-ticket-standards.md
├── epics-created-summary.md
├── sprint-1-stories-created.md
├── sprint-2-stories-created.md
├── sprint-3-stories-created.md
├── sprint-4-stories-created.md
├── sprint-5-stories-created.md
└── sprint-6-stories-created.md
```
Plus ~50-80 Stories in Jira

### After Detail Pass
```
outputs/
├── [previous files]
├── sprint-1-stories-updated-batch-1.md
├── sprint-1-stories-updated-batch-2.md
└── [etc...]
```

---

## 🎓 Key Concepts

### Jira Integration
- Claude creates issues directly via API
- No manual data entry needed
- Reference docs saved to repo
- Actual work tracked in Jira

### Issue Hierarchy
```
Epic (Sprint container)
├── Story (User functionality)
│   └── Subtask (Implementation)
├── Task (Technical work)
│   └── Subtask (Setup step)
└── Bug (Defects)
```

### Sprint Structure
1. **Sprint 1**: Application Setup (Infrastructure)
2. **Sprint 2**: Assessment Engine Core (Core feature)
3. **Sprint 3**: Video Management & Streaming (Media)
4. **Sprint 4**: User Dashboards & Progress (User experience)
5. **Sprint 5**: Business Portal (B2B features)
6. **Sprint 6**: Company Management (Admin features)

---

## ⚡ Quick Reference

| Need | See |
|------|-----|
| Get started | SETUP-COMPLETE.md |
| Understand workflow | README.md |
| Visual diagrams | WORKFLOW-VISUAL.md |
| Track progress | CHECKLIST.md |
| Solve issues | TROUBLESHOOTING.md |
| Jira details | jira-integration-reference.md |
| Create tickets | chat-1-prompt.md, chat-2-prompt.md |

---

## 🚨 Important Notes

1. **Start fresh chats**: Each prompt in new Claude conversation
2. **Verify Jira**: Check issues created after each chat
3. **Save outputs**: Reference docs to `outputs/` folder
4. **Track progress**: Use CHECKLIST.md
5. **Get help**: TROUBLESHOOTING.md for common issues

---

## ✅ Ready to Start?

1. Open `SETUP-COMPLETE.md`
2. Read the summary
3. Copy `chat-1-prompt.md`
4. Start new Claude chat
5. Paste prompt and go!

**You're all set!** 🎉

---

## 📝 Document Updates

When creating new prompts or docs:
- [ ] Add to this index
- [ ] Update CHECKLIST.md if needed
- [ ] Update WORKFLOW-VISUAL.md if flow changes
- [ ] Update README.md with new chat steps

---

**Questions?** Check TROUBLESHOOTING.md or the specific reference doc for your topic.
