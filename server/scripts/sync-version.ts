import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

/**
 * Automatische Versie Synchronisatie Script
 * Gebruikt package.json als Single Source of Truth.
 */

async function syncVersion() {
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const version = pkg.version;
  const date = new Date().toISOString().split('T')[0];

  console.log(`🚀 Synchroniseren naar versie: v${version} (${date})`);

  const targets = [
    { file: 'ARCHITECTURE.md', pattern: /Versie: v[\d.]+/g, replacement: `Versie: v${version}` },
    { file: 'ARCHITECTUUR.md', pattern: /Versie: v[\d.]+/g, replacement: `Versie: v${version}` },
    { file: 'AGENTS.md', pattern: /Versie: v[\d.]+/g, replacement: `Versie: v${version}` },
    { file: 'README.md', pattern: /v[\d.]+/g, replacement: `v${version}`, limit: 1 }, // Only first line
    { file: 'ROADMAPv3.md', pattern: /Versie: v[\d.]+/g, replacement: `Versie: v${version}` },
    { file: 'REFACTOR_ADVICE.md', pattern: /Versie: v[\d.]+/g, replacement: `Versie: v${version}` },
    { file: 'src/App.tsx', pattern: /v[\d.]+/g, replacement: `v${version}` } // Search entire file
  ];

  for (const target of targets) {
    const filePath = path.join(rootDir, target.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Bestand niet gevonden: ${target.file}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    if (target.limit) {
      // Direct replacement with limit logic for specific files
      for (let i = 0; i < Math.min(lines.length, target.limit); i++) {
        if (target.pattern.test(lines[i])) {
          lines[i] = lines[i].replace(target.pattern, target.replacement);
          modified = true;
        }
      }
      content = lines.join('\n');
    } else {
      // Global replacement for version headers
      if (target.pattern.test(content)) {
        content = content.replace(target.pattern, target.replacement);
        modified = true;
      }
    }

    // Update 'Bijgewerkt' date if present on the same line as version
    if (modified) {
      content = content.replace(/Bijgewerkt: \d{4}-\d{2}-\d{2}/g, `Bijgewerkt: ${date}`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${target.file} bijgewerkt.`);
    }
  }

  console.log('\n✨ Synchronisatie voltooid!');
}

syncVersion().catch(err => {
  console.error('❌ Synchronisatie mislukt:', err);
  process.exit(1);
});
