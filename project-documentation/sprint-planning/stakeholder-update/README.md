# FFP Stakeholder Update

Modular HTML structure for the FFP stakeholder progress update presentation.

## Structure

```
stakeholder-update/
├── build.js                # Combines files into single HTML
├── index.html              # Template with CSS, nav, and loader
├── overview.html           # Sections 1-12 (project overview)
├── closing.html            # Section 27 (questions slide)
└── sprint-updates/
    ├── sprint-1.html       # Sections 13-17
    ├── sprint-2.html       # Sections 18-21
    └── sprint-3.html       # Sections 22-26
```

## Building

Run from this folder:

```bash
node build.js
```

Output: `../ffp-stakeholder-update.html` - a single portable file that opens directly in any browser.

## Adding a New Sprint

1. **Create the sprint file:**

   ```bash
   touch sprint-updates/sprint-4.html
   ```

2. **Add sections** following the existing pattern:

   ```html
   <!-- Section XX: Sprint 4 Title -->
   <section id="section-XX" class="section center">
     <h1>Sprint 4 Complete</h1>
     ...
   </section>
   ```

3. **Update navigation** in `index.html`:

   ```html
   <div class="menu-section">
     <div class="menu-section-header collapsed" onclick="toggleSection('sprint4')">
       <span>Sprint 4 (Jan 2026)</span>
       <i class="fas fa-chevron-down"></i>
     </div>
     <div class="menu-items collapsed" id="sprint4-items">
       <a class="menu-item" onclick="jumpToSection(XX)">Sprint 4 Title</a>
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
     'sprint-updates/sprint-4.html', // Add this
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
| closing.html  | 27       |

When adding Sprint 4, continue from section 28.
