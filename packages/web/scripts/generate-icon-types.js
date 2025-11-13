#!/usr/bin/env node

/**
 * Generates TypeScript types from Icomoon selection.json
 * Run with: pnpm icon:generate
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SELECTION_PATH = join(__dirname, '../src/assets/icomoon/selection.json');
const OUTPUT_PATH = join(__dirname, '../src/components/Icon/types.ts');

try {
  // Read selection.json
  const selectionData = readFileSync(SELECTION_PATH, 'utf8');
  const selection = JSON.parse(selectionData);

  if (!selection.icons || !Array.isArray(selection.icons)) {
    throw new Error('Invalid selection.json: missing icons array');
  }

  // Extract icon names
  const iconNames = selection.icons
    .map((icon) => icon.properties?.name)
    .filter(Boolean)
    .sort();

  if (iconNames.length === 0) {
    throw new Error('No icons found in selection.json');
  }

  // Generate TypeScript enum
  const enumEntries = iconNames
    .map((name) => {
      const enumKey = name.toUpperCase().replace(/-/g, '_');
      return `  ${enumKey} = '${name}',`;
    })
    .join('\n');

  const typeDefinition = `/**
 * Auto-generated icon types from Icomoon selection.json
 * DO NOT EDIT MANUALLY - Run 'pnpm icon:generate' to update
 *
 * Generated: ${new Date().toISOString()}
 * Total icons: ${iconNames.length}
 */

export enum Icons {
${enumEntries}
}

export type IconName = \`\${Icons}\`;
`;

  // Write to file
  writeFileSync(OUTPUT_PATH, typeDefinition, 'utf8');

  console.log('✅ Icon types generated successfully!');
  console.log(`   - ${iconNames.length} icons found`);
  console.log(`   - Output: ${OUTPUT_PATH}`);
  console.log('\nIcon names:');
  iconNames.forEach((name) => console.log(`   - ${name}`));
} catch (error) {
  console.error('❌ Error generating icon types:', error.message);
  process.exit(1);
}
