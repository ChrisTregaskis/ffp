# FFP Stakeholder Update

Modular HTML structure for the FFP stakeholder progress update presentation.

## Structure

```
stakeholder-update/
├── build.js                # Combines files into single HTML
├── index.html              # Template with CSS, nav, and loader
├── overview.html           # Sections 1-12 (project overview)
├── closing.html            # Section 32 (questions slide)
└── sprint-updates/
    ├── sprint-1.html       # Sections 13-17
    ├── sprint-2.html       # Sections 18-21
    ├── sprint-3.html       # Sections 22-26
    └── sprint-4.html       # Sections 27-31
```

## Building

Run from this folder:

```bash
node build.js
```

Output: `../_stakeholder-update.build.html` - a single portable file that opens directly in any browser (gitignored).

## Adding a New Sprint

1. **Create the sprint file:**

   ```bash
   touch sprint-updates/sprint-5.html
   ```

2. **Add sections** following the existing pattern:

   ```html
   <!-- Section 33: Sprint 5 Title -->
   <section id="section-33" class="section center">
     <h1>Sprint 5 Complete</h1>
     ...
   </section>
   ```

3. **Update navigation** in `index.html`:

   ```html
   <div class="menu-section">
     <div class="menu-section-header collapsed" onclick="toggleSection('sprint5')">
       <span>Sprint 5 (Feb 2026)</span>
       <i class="fas fa-chevron-down"></i>
     </div>
     <div class="menu-items collapsed" id="sprint5-items">
       <a class="menu-item" onclick="jumpToSection(33)">Sprint 5 Title</a>
       <!-- Add more nav items -->
     </div>
   </div>
   ```

4. **Add to build script** in `build.js`:

   ```javascript
   const CONTENT_FILES = [
     'overview.html',
     'sprint-updates/sprint-1.html',
     'sprint-updates/sprint-2.html',
     'sprint-updates/sprint-3.html',
     'sprint-updates/sprint-4.html',
     'sprint-updates/sprint-5.html',
     'closing.html',
   ];
   ```

5. **Rebuild:**
   ```bash
   node build.js
   ```

## Development Server (Optional)

For live preview with auto-refresh while editing:

```bash
# Using Python
python3 -m http.server 8000

# Or VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8000`.

## Section Numbering

| File          | Sections |
| ------------- | -------- |
| overview.html | 1-12     |
| sprint-1.html | 13-17    |
| sprint-2.html | 18-21    |
| sprint-3.html | 22-26    |
| sprint-4.html | 27-31    |
| closing.html  | 32       |

When adding Sprint 5, continue from section 33.

---

## Claude Prompt for Future Sprints

Use this prompt when a sprint completes:

```
Update the stakeholder update for Sprint [N]. Reference:
- `project-documentation/progress-log.md` for implementation details
- `project-documentation/project-state.md` for story summaries

Files to update:
1. Create `sprint-updates/sprint-[N].html` (follow existing sprint patterns)
2. Update `closing.html` section number and metrics (tests, hours)
3. Update `index.html` navigation (add sprint menu section, update closing section number)
4. Update `build.js` CONTENT_FILES array
5. Update this README (structure diagram, section numbering table)
6. Run `node build.js` to generate output (gitignored)

Pattern notes:
- Each sprint has ~5 sections (title, 2-3 content slides, numbers)
- Use consistent CSS classes: section, center, two-column, tech-grid, workflow-grid, metric-box
- Update closing slide metrics to reflect latest test count and hours invested
```
