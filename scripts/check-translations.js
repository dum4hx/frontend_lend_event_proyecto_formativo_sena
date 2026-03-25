#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesPath = path.join(__dirname, "..", "src", "i18n", "locales");

/**
 * Load all translation files from modular structure
 */
function loadModularTranslations(lang) {
  const langPath = path.join(localesPath, lang);
  const translations = {};

  if (!fs.existsSync(langPath)) {
    console.error(`❌ Language path not found: ${langPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(langPath).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(langPath, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(content);
    Object.assign(translations, json);
  }

  return translations;
}

/**
 * Main validation
 */
function validateTranslations() {
  console.log("\n 🔍 Checking translation coverage (modular)...\n");

  try {
    const enTranslations = loadModularTranslations("en");
    const esTranslations = loadModularTranslations("es");

    const enKeys = Object.keys(enTranslations).sort();
    const esKeys = new Set(Object.keys(esTranslations));

    // Keys missing in Spanish
    const missingInES = enKeys.filter((key) => !esKeys.has(key));

    // Keys in Spanish but not in English (orphans)
    const orphanInES = Object.keys(esTranslations).filter((key) => !enKeys.includes(key));

    // Statistics
    const totalKeys = enKeys.length;
    const translatedKeys = totalKeys - missingInES.length;
    const coverage = ((translatedKeys / totalKeys) * 100).toFixed(2);

    // Display results
    console.log(
      `📊 Translation Coverage: ${coverage}% (${translatedKeys}/${totalKeys})`
    );
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
      console.log(
        `⚠️  Orphaned Spanish keys (${orphanInES.length}) - not in English:`
      );
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
    console.error("❌ Error reading translations:", error.message);
    process.exit(1);
  }
}

// Run validation
const isValid = validateTranslations();
process.exit(isValid ? 0 : 1);
