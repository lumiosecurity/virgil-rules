#!/usr/bin/env node
// test-regex.js — attempts to compile every patternString as a RegExp
// Catches invalid syntax before it gets merged and breaks the extension

import { readFileSync, appendFileSync } from 'fs';

const files = process.argv.slice(2).filter(f => f.endsWith('.json'));
if (files.length === 0) { console.log('No files to check.'); process.exit(0); }

let hasErrors = false;
const report = ['\n### Regex Compilation Check\n'];

for (const file of files) {
  const errors = [];

  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));

    (data.sourcePatterns || []).forEach(p => {
      try {
        new RegExp(p.patternString, p.patternFlags || '');
      } catch (e) {
        hasErrors = true;
        errors.push(`❌ Pattern \`${p.id}\`: ${e.message}`);
        errors.push(`   Pattern: \`${p.patternString}\``);
      }
    });

    if (errors.length === 0) {
      const count = (data.sourcePatterns || []).length;
      console.log(`✅ ${file} — ${count} pattern(s) compiled OK`);
      report.push(`✅ \`${file}\` — all patterns valid`);
    } else {
      errors.forEach(e => { console.error(e); report.push(`- ${e}`); });
    }

  } catch (e) {
    console.error(`Could not read ${file}: ${e.message}`);
  }
}

appendFileSync('/tmp/validation-report.md', report.join('\n') + '\n');
process.exit(hasErrors ? 1 : 0);
