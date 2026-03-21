#!/usr/bin/env node
// check-duplicates.js — ensures no rule IDs in the PR already exist in the repo
// Also checks for duplicate phishUrl submissions

import { readFileSync, readdirSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesRoot = resolve(__dirname, '../../rules');

// ── Collect all existing IDs ──────────────────────────────────────────────────

function collectExistingIds(excludeFiles = []) {
  const ids = { sourcePatterns: new Set(), signalFunctions: new Set(), brandEntries: new Set() };
  const urls = new Set();

  for (const dir of ['domain', 'source', 'combined']) {
    let entries;
    try { entries = readdirSync(`${rulesRoot}/${dir}`); } catch { continue; }

    for (const filename of entries) {
      if (!filename.endsWith('.json')) continue;
      const fullPath = `${rulesRoot}/${dir}/${filename}`;
      if (excludeFiles.some(f => f.endsWith(filename))) continue; // skip files being added

      try {
        const data = JSON.parse(readFileSync(fullPath, 'utf8'));
        (data.sourcePatterns || []).forEach(p => ids.sourcePatterns.add(p.id));
        (data.domainRules?.signalFunctions || []).forEach(f => ids.signalFunctions.add(f.id));
        (data.domainRules?.brandEntries || []).forEach(e => ids.brandEntries.add(e.name));
        if (data._meta?.phishUrl) urls.add(data._meta.phishUrl);
      } catch {}
    }
  }

  return { ids, urls };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const newFiles = process.argv.slice(2).filter(f => f.endsWith('.json'));
if (newFiles.length === 0) { console.log('No files to check.'); process.exit(0); }

const { ids: existing, urls: existingUrls } = collectExistingIds(newFiles);

let hasConflicts = false;
const report = ['\n### Duplicate ID Check\n'];

for (const file of newFiles) {
  const conflicts = [];

  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));

    // Check phishUrl
    const url = data._meta?.phishUrl;
    if (url && existingUrls.has(url)) {
      conflicts.push(`⚠ phishUrl already exists in another submission: \`${url}\``);
      // Warning, not error — same domain may be submitted by different researchers
    }

    // Check source pattern IDs
    (data.sourcePatterns || []).forEach(p => {
      if (existing.sourcePatterns.has(p.id)) {
        hasConflicts = true;
        conflicts.push(`❌ Source pattern ID \`${p.id}\` already exists`);
      }
    });

    // Check signal function IDs
    (data.domainRules?.signalFunctions || []).forEach(f => {
      if (existing.signalFunctions.has(f.id)) {
        hasConflicts = true;
        conflicts.push(`❌ Signal function ID \`${f.id}\` already exists`);
      }
    });

    // Check brand names
    (data.domainRules?.brandEntries || []).forEach(e => {
      if (existing.brandEntries.has(e.name)) {
        hasConflicts = true;
        conflicts.push(`❌ Brand entry \`${e.name}\` already exists — add typos to the existing entry instead`);
      }
    });

    if (conflicts.length === 0) {
      console.log(`✅ ${file} — no duplicate IDs`);
      report.push(`✅ \`${file}\` — no duplicates`);
    } else {
      conflicts.forEach(c => { console.log(`  ${c}`); report.push(`- ${c}`); });
    }

  } catch (e) {
    console.error(`Could not read ${file}: ${e.message}`);
  }
}

appendFileSync('/tmp/validation-report.md', report.join('\n') + '\n');
process.exit(hasConflicts ? 1 : 0);
