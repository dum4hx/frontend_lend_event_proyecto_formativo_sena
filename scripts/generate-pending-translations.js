#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translationsPath = path.join(
  __dirname,
  "..",
  "src",
  "i18n",
  "translations.ts"
);
const pendingPath = path.join(
  __dirname,
  "..",
  "pending-translations.json"
);

/**
 * Extract translation objects from TypeScript file
 */
function extractTranslations(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  const enMatch = content.match(/const EN_TRANSLATIONS = \{([\s\S]*?)\} as const/);
  const esMatch = content.match(
    /const ES_TRANSLATIONS: Record<TranslationKey, string> = \{([\s\S]*?)\};/
  );

  if (!enMatch || !esMatch) {
    console.error("❌ Could not find translation objects in file");
    process.exit(1);
  }

  return {
    enContent: enMatch[1],
    esContent: esMatch[1],
  };
}

/**
 * Parse translation entries from content string
 */
function parseTranslationEntries(content) {
  const entries = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const match = line.match(/"([^"]+)":\s*"([^"]*)"/);
    if (match) {
      const [, key, value] = match;
      entries[key] = value;
    }
  }

  return entries;
}

/**
 * Generate pending translations file
 */
function generatePendingTranslations() {
  console.log("\n 🔍 Analyzing pending translations...\n");

  try {
    const { enContent, esContent } = extractTranslations(translationsPath);
    const enEntries = parseTranslationEntries(enContent);
    const esEntries = parseTranslationEntries(esContent);

    // Find missing keys
    const pending = {};
    const missingKeys = Object.keys(enEntries).filter((key) => !esEntries[key]);

    if (missingKeys.length === 0) {
      console.log("✅ No pending translations! All keys are translated.");
      console.log("");
      if (fs.existsSync(pendingPath)) {
        fs.unlinkSync(pendingPath);
        console.log("🗑️  Removed pending-translations.json (all done!)");
      }
      return;
    }

    // Build pending object with English reference
    missingKeys.forEach((key) => {
      pending[key] = {
        en: enEntries[key],
        es: "[TRANSLATE_ME]",
      };
    });

    // Write to file
    fs.writeFileSync(
      pendingPath,
      JSON.stringify(pending, null, 2),
      "utf-8"
    );

    console.log(
      `📝 Generated pending-translations.json with ${missingKeys.length} keys`
    );
    console.log("");
    console.log(`📋 Sample pending translations:`);
    console.log("─".repeat(60));
    Object.entries(pending)
      .slice(0, 5)
      .forEach(([key, { en, es }]) => {
        console.log(`\n  Key: "${key}"`);
        console.log(`  EN:  "${en}"`);
        console.log(`  ES:  ${es}`);
      });

    if (missingKeys.length > 5) {
      console.log(`\n  ... and ${missingKeys.length - 5} more keys\n`);
    } else {
      console.log("");
    }

    console.log("✨ How to use:");
    console.log(
      "  1. Share pending-translations.json with your translator"
    );
    console.log(`  2. Run: npm run update:translations <file-path>`);
    console.log("     (coming next!)\n");
  } catch (error) {
    console.error("❌ Error generating pending translations:", error.message);
    process.exit(1);
  }
}

generatePendingTranslations();
