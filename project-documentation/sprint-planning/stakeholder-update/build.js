#!/usr/bin/env node

/**
 * Build script for FFP Stakeholder Update
 *
 * Combines modular HTML files into a single portable file.
 *
 * Usage:
 *   node build.js
 *
 * Output:
 *   ../ffp-stakeholder-update.html
 */

const fs = require('fs');
const path = require('path');

const CONTENT_FILES = [
  'overview.html',
  'sprint-updates/sprint-1.html',
  'sprint-updates/sprint-2.html',
  'sprint-updates/sprint-3.html',
  'sprint-updates/sprint-4.html',
  'closing.html',
];

const OUTPUT_FILE = '../_stakeholder-update.build.html';

function build() {
  console.log('Building FFP Stakeholder Update...\n');

  // Read index.html as template
  const indexPath = path.join(__dirname, 'index.html');
  let template = fs.readFileSync(indexPath, 'utf-8');

  // Read and combine all content files
  const contents = CONTENT_FILES.map((file) => {
    const filePath = path.join(__dirname, file);
    console.log(`  ✓ Loading ${file}`);
    return fs.readFileSync(filePath, 'utf-8');
  });

  const combinedContent = contents.join('\n\n');

  // Replace the dynamic loader with static content
  // Find the main-content div and replace its contents
  const mainContentRegex =
    /(<div class="main-content" id="mainContent">)[\s\S]*?(<!-- End Main Content Wrapper -->)/;

  const staticMainContent = `$1
      ${combinedContent}
    </div>
    $2`;

  template = template.replace(mainContentRegex, staticMainContent);

  // Remove the JavaScript that does dynamic loading
  // Keep only the menu functions
  const scriptRegex = /<script>[\s\S]*?<\/script>/;
  const staticScript = `<script>
      let menuOpen = true;

      // Menu functions
      function toggleMenu() {
        menuOpen = !menuOpen;
        const menu = document.getElementById('sideMenu');
        const mainContent = document.getElementById('mainContent');
        const menuToggle = document.getElementById('menuToggle');

        if (menuOpen) {
          menu.classList.remove('hidden');
          mainContent.classList.remove('menu-hidden');
          menuToggle.classList.add('menu-open');
          menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        } else {
          menu.classList.add('hidden');
          mainContent.classList.add('menu-hidden');
          menuToggle.classList.remove('menu-open');
          menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
      }

      function toggleSection(sectionId) {
        const header = event.currentTarget;
        const items = document.getElementById(sectionId + '-items');

        header.classList.toggle('collapsed');
        items.classList.toggle('collapsed');
      }

      function jumpToSection(section) {
        document.getElementById(\`section-\${section}\`).scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        updateActiveMenuItem(section);
      }

      function updateActiveMenuItem(section) {
        // Remove active class from all menu items
        document.querySelectorAll('.menu-item').forEach((item) => {
          item.classList.remove('active');
        });

        // Add active class to clicked section's menu item
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach((item) => {
          const onClick = item.getAttribute('onclick');
          if (onClick && onClick.includes(\`jumpToSection(\${section})\`)) {
            item.classList.add('active');
          }
        });
      }
    </script>`;

  template = template.replace(scriptRegex, staticScript);

  // Remove loading-related CSS
  template = template.replace(/\/\* Loading state \*\/[\s\S]*?\.loading i \{[\s\S]*?\}/g, '');

  // Write output file
  const outputPath = path.join(__dirname, OUTPUT_FILE);
  fs.writeFileSync(outputPath, template);

  const stats = fs.statSync(outputPath);
  const sizeKb = (stats.size / 1024).toFixed(1);

  console.log(`\n✓ Built successfully!`);
  console.log(`  Output: ${OUTPUT_FILE} (${sizeKb} KB)`);
  console.log(`\nOpen the file directly in your browser - no server needed.`);
}

try {
  build();
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
