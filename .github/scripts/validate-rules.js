#!/usr/bin/env node
// validate-rules.js — validates rule JSON files against the schema
// Writes a markdown report to /tmp/validation-report.md

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, '../../schema/rule-submission.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const files = process.argv.slice(2).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.log('No JSON files to validate.');
  process.exit(0);
}

const report = [];
let hasErrors = false;

for (const file of files) {
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const valid = validate(data);

    if (valid) {
      console.log(`✅ ${file} — valid`);
      report.push(`### ✅ \`${file}\` — schema valid`);

      // Extra checks
      const warnings = [];

      if (!data.domainRules && !data.sourcePatterns) {
        warnings.push('⚠ File contains neither domainRules nor sourcePatterns');
      }
      if (data._meta?.confidence === 'low') {
        warnings.push('ℹ Low-confidence submission — extra scrutiny recommended');
      }
      if ((data.domainRules?.brandEntries || []).some(e => e.typos?.length < 2)) {
        warnings.push('⚠ Some brand entries have fewer than 2 typos — consider expanding');
      }

      if (warnings.length) {
        report.push('**Warnings:**');
        warnings.forEach(w => report.push(`- ${w}`));
      }

    } else {
      hasErrors = true;
      console.error(`❌ ${file} — ${validate.errors.length} schema error(s)`);
      report.push(`### ❌ \`${file}\` — schema errors`);
      validate.errors.forEach(err => {
        const msg = `\`${err.instancePath || '/'}\` ${err.message}`;
        console.error('  ', msg);
        report.push(`- ${msg}`);
      });
    }

  } catch (e) {
    hasErrors = true;
    console.error(`❌ ${file} — parse error: ${e.message}`);
    report.push(`### ❌ \`${file}\` — JSON parse error: ${e.message}`);
  }

  report.push('');
}

writeFileSync('/tmp/validation-report.md', report.join('\n'));
process.exit(hasErrors ? 1 : 0);
