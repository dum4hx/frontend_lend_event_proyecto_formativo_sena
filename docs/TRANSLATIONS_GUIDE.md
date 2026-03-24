# Translation Management Guide

## Overview

This guide explains how to manage translations efficiently for English (EN) and Spanish (ES) in the LendEvent frontend.

## Commands Available

### 1. Check Translation Coverage
```bash
npm run check:translations
```
**Purpose:** Verify that all English language keys have Spanish translations.

**Output:**
- ✅ Coverage percentage
- ⚠️ Missing Spanish translations
- ⚠️ Orphaned Spanish keys (no English equivalent)

**Exit code:** 0 if all good, 1 if issues found.

### 2. Generate Pending Translations
```bash
npm run generate:pending-translations
```
**Purpose:** Create a JSON file with all untranslated keys, ready to send to a translator.

**Output:**
- Creates `pending-translations.json` with structure:
  ```json
  {
    "key.name": {
      "en": "English text",
      "es": "[TRANSLATE_ME]"
    }
  }
  ```

**Use case:** Share this file with translators who don't need to touch the codebase.

### 3. Update Translations from JSON
```bash
npm run update:translations ./pending-translations.json
```
**Purpose:** Merge completed translations from a JSON file back into `src/i18n/translations.ts`.

**Input:** A JSON file with the same structure, but with `"es"` field filled:
```json
{
  "key.name": {
    "en": "English text",
    "es": "Texto en español"
  }
}
```

**Output:** Updated `src/i18n/translations.ts` with new translations merged.

---

## Workflow Example

### Scenario: Adding new features with translations

#### Step 1: Add English Strings
Edit `src/i18n/translations.ts` and add to `EN_TRANSLATIONS`:
```typescript
const EN_TRANSLATIONS = {
  // existing keys...
  "reports.exportPdf": "Export as PDF",
  "reports.emailReport": "Send via Email",
} as const;
```

#### Step 2: Check Coverage
```bash
npm run check:translations
```
Output shows:
```
⚠️  Missing Spanish translations (2):
───────────────────────────
  • "reports.exportPdf"
  • "reports.emailReport"
```

#### Step 3: Generate Pending File
```bash
npm run generate:pending-translations
```
Creates `pending-translations.json`:
```json
{
  "reports.exportPdf": {
    "en": "Export as PDF",
    "es": "[TRANSLATE_ME]"
  },
  "reports.emailReport": {
    "en": "Send via Email",
    "es": "[TRANSLATE_ME]"
  }
}
```

#### Step 4: Send to Translator
Share `pending-translations.json` with your translator. They fill it with:
```json
{
  "reports.exportPdf": {
    "en": "Export as PDF",
    "es": "Exportar como PDF"
  },
  "reports.emailReport": {
    "en": "Send via Email",
    "es": "Enviar por correo"
  }
}
```

#### Step 5: Merge Translations
```bash
npm run update:translations ./pending-translations.json
```

#### Step 6: Verify & Format
```bash
npm run check:translations  # Should show 100% coverage
npm run format              # Auto-format the code
npm run lint               # Check for errors
```

#### Step 7: Commit
```bash
git add src/i18n/translations.ts
git commit -m "feat(i18n): add reports module translations (PDF export, email)"
```

---

## Best Practices

### ✅ DO:
- Run `npm run check:translations` after adding any new EN_TRANSLATIONS key
- **Always add Spanish translation immediately** when adding English
- Use `generate:pending-translations` when collecting multiple translations
- Keep keys organized (use prefixes: `reports.`, `settings.`, etc.)

### ❌ DON'T:
- Forget to translate keys after adding them
- Leave `[TRANSLATE_ME]` in pending files without filling them
- Manually edit the generated `pending-translations.json` structure
- Commit `pending-translations.json` to git (add to `.gitignore`)

---

## File Locations

| File | Purpose |
|------|---------|
| `src/i18n/translations.ts` | Master translations file (both EN and ES) |
| `pending-translations.json` | Auto-generated file with pending translations |
| `pending-translations.example.json` | Example structure for reference |
| `scripts/check-translations.js` | Validator script |
| `scripts/generate-pending-translations.js` | Generator script |
| `scripts/update-translations.js` | Merger script |

---

## Tips & Tricks

### Run all translation checks before commit
```bash
npm run lint && npm run format && npm run check:translations
```

### If you have multiple pending files
Process them one at a time:
```bash
npm run update:translations ./pending-march.json
npm run update:translations ./pending-april.json
npm run check:translations  # Verify all merged
```

### Revert accidental merge
```bash
git checkout src/i18n/translations.ts
```

---

## Integration with CI/CD (Optional Future)

Consider adding to your GitHub Actions or CI pipeline:
```yaml
- name: Check translations
  run: npm run check:translations
```

This ensures no untranslated keys get merged to production.

---

**Last Updated:** March 24, 2026
