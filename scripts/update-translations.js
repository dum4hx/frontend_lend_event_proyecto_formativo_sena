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

/**
 * Validate arguments
 */
function validateArgs() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error(
      "\n❌ Usage: npm run update:translations <path-to-completed-translations.json>"
    );
    console.error(
      "\nExample:\n  npm run update:translations ./pending-translations.json\n"
    );
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\n❌ File not found: ${fullPath}\n`);
    process.exit(1);
  }

  return fullPath;
}

/**
 * Load and validate JSON file
 */
function loadTranslations(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Invalid JSON file: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Merge new translations into existing file
 */
function mergeTranslations() {
  const filePath = validateArgs();

  console.log("\n 🔄 Merging translations...\n");

  try {
    // Load completed translations
    const completed = loadTranslations(filePath);
    const translationContent = fs.readFileSync(translationsPath, "utf-8");

    // Extract current ES_TRANSLATIONS
    const esMatch = translationContent.match(
      /const ES_TRANSLATIONS: Record<TranslationKey, string> = \{([\s\S]*?)\};/
    );

    if (!esMatch) {
      console.error("❌ Could not find ES_TRANSLATIONS in file");
      process.exit(1);
    }

    // Build new ES_TRANSLATIONS object
    let esTranslationsSection = "const ES_TRANSLATIONS: Record<TranslationKey, string> = {";

    // Get existing translations
    const existingContent = esMatch[1];
    const existingLines = existingContent
      .split("\n")
      .filter((line) => line.trim());

    // Preserve existing, add new
    const seenKeys = new Set();
    for (const line of existingLines) {
      const match = line.match(/"([^"]+)":/);
      if (match) {
        seenKeys.add(match[1]);
        esTranslationsSection += `\n  ${line.trim()}`;
      }
    }

    // Add new translations
    let added = 0;
    Object.entries(completed).forEach(([key, { es }]) => {
      if (
        !seenKeys.has(key) &&
        es &&
        es !== "[TRANSLATE_ME]" &&
        es.trim() !== ""
      ) {
        esTranslationsSection += `\n  "${key}": "${es.replace(/"/g, '\\"')}",`;
        added++;
        seenKeys.add(key);
      }
    });

    esTranslationsSection += "\n};";

    // Replace in file
    const updatedContent = translationContent.replace(
      /const ES_TRANSLATIONS: Record<TranslationKey, string> = \{[\s\S]*?\};/,
      esTranslationsSection
    );

    fs.writeFileSync(translationsPath, updatedContent, "utf-8");

    console.log(`✅ Successfully merged ${added} new translations!`);
    console.log("");
    console.log("📝 Next steps:");
    console.log("  1. Review changes in src/i18n/translations.ts");
    console.log("  2. Run: npm run check:translations");
    console.log("  3. Run: npm run format");
    console.log("  4. Commit your changes\n");
  } catch (error) {
    console.error("❌ Error merging translations:", error.message);
    process.exit(1);
  }
}

mergeTranslations();
