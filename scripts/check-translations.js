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
 * Extract translation keys from the TypeScript file
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

  const enKeys = extractKeys(enMatch[1]);
  const esKeys = extractKeys(esMatch[1]);

  return { enKeys, esKeys };
}

/**
 * Extract key names from translation object content
 */
function extractKeys(content) {
  const keyRegex = /"([^"]+)":/g;
  const keys = new Set();
  let match;

  while ((match = keyRegex.exec(content)) !== null) {
    keys.add(match[1]);
  }

  return keys;
}

/**
 * Format a Set into a sorted array
 */
function formatSet(set) {
  return Array.from(set).sort();
}

/**
 * Main validation
 */
function validateTranslations() {
  console.log(
    "\n 🔍 Checking translation coverage...\n"
  );

  try {
    const { enKeys, esKeys } = extractTranslations(translationsPath);

    const enArray = formatSet(enKeys);
    const esArray = formatSet(esKeys);

    // Keys missing in Spanish
    const missingInES = enArray.filter((key) => !esKeys.has(key));

    // Keys in Spanish but not in English (orphans)
    const orphanInES = esArray.filter((key) => !enKeys.has(key));

    // Statistics
    const totalKeys = enArray.length;
    const translatedKeys = totalKeys - missingInES.length;
    const coverage = ((translatedKeys / totalKeys) * 100).toFixed(2);

    // Display results
    console.log(`📊 Translation Coverage: ${coverage}% (${translatedKeys}/${totalKeys})`);
    console.log("");

    if (missingInES.length > 0) {
      console.log(`⚠️  Missing Spanish translations (${missingInES.length}):`);
      console.log("─".repeat(60));
      missingInES.forEach((key) => {
        console.log(`  • "${key}"`);
      });
      console.log("");
    }

    if (orphanInES.length > 0) {
      console.log(`⚠️  Orphaned Spanish keys (${orphanInES.length}) - not in English:`);
      console.log("─".repeat(60));
      orphanInES.forEach((key) => {
        console.log(`  • "${key}"`);
      });
      console.log("");
    }

    if (missingInES.length === 0 && orphanInES.length === 0) {
      console.log("✅ All translations are complete and synchronized!");
      console.log("");
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Error reading translations file:", error.message);
    process.exit(1);
  }
}

// Run validation
const isValid = validateTranslations();
process.exit(isValid ? 0 : 1);
