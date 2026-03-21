# Virgil Community Rules

Community-contributed detection rules for the [Virgil](https://github.com/lumiosecurity/extension) browser extension.

## How to contribute

### Via the extension (recommended)

1. Navigate to a confirmed phishing page
2. Open Virgil → click **⚗ Rules** to open the Rule Generator panel
3. Add your analysis and IOCs, click **Generate Detection Rules**
4. Review the generated rules, then click **Submit to Community**

The extension handles branch creation, file formatting, and PR submission automatically.

### Manual submission

1. Fork this repo
2. Create a branch: `rules/{type}/{date}-{slug}`
3. Add your rule file to `rules/domain/`, `rules/source/`, or `rules/combined/`
4. The file must validate against `schema/rule-submission.json`
5. Open a PR — CI will validate automatically

## Rule file format

```json
{
  "_meta": {
    "schemaVersion": "1.0",
    "submittedAt": "2025-01-15T12:00:00.000Z",
    "phishUrl": "https://chase-secure-verify.xyz/login",
    "confidence": "high",
    "campaignTags": ["banking", "credential-harvest", "hcaptcha-shield"],
    "verticals": ["financial"],
    "ruleType": "combined"
  },
  "summary": "...",
  "iocs": ["POST /send.php", "Telegram bot: 123456:AAF..."],
  "domainRules": { ... },
  "sourcePatterns": [ ... ]
}
```

Full schema: [`schema/rule-submission.json`](schema/rule-submission.json)

## Directory structure

```
rules/
  domain/      ← domain-analyzer.js rules (brand entries, signal functions)
  source/      ← phishkit-detector.js patterns (regex source scans)
  combined/    ← submissions containing both
schema/
  rule-submission.json   ← JSON Schema (used by CI validation)
.github/
  workflows/
    validate-rules.yml   ← PR validation workflow
  scripts/
    validate-rules.js    ← schema validation
    check-duplicates.js  ← duplicate ID detection
    test-regex.js        ← regex compilation check
```

## Review process

All PRs go through automated CI checks:

| Check | What it does |
|-------|-------------|
| Schema validation | Ensures file matches `rule-submission.json` |
| Duplicate ID check | Prevents collisions with existing rule IDs |
| Regex compilation | Verifies all `patternString` values are valid JS regex |

After CI passes, a maintainer reviews for:
- False positive risk
- Coverage quality
- IOC sensitivity (no PII, scrubbed tokens)

## Labels

PRs are auto-labeled by CI:

- `vertical:financial` / `vertical:crypto` / `vertical:sso` / `vertical:ecommerce` / `vertical:general`
- `type:domain-rules` / `type:source-patterns` / `type:combined`
- `confidence:high` / `confidence:medium` / `confidence:low`
- `needs-review` — set on all incoming PRs, removed by maintainer on approval

## Code of conduct

- Do not include sensitive personal information in IOCs
- Scrub or truncate live API tokens before submitting (last 6 chars only)
- Do not submit rules targeting legitimate sites
- Submissions are public — assume anything you include will be seen
