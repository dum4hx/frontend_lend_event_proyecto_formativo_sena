#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesPath = path.join(__dirname, "..", "src", "i18n", "locales");

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
 * Load all translation files from a language directory
 */
function loadLanguageData(lang) {
  const langPath = path.join(localesPath, lang);
  const data = {};

  if (!fs.existsSync(langPath)) {
    console.error(`❌ Language path not found: ${langPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(langPath).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(langPath, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(content);
    data[file] = json;
  }

  return data;
}

/**
 * Determine which module a key belongs to
 */
function getKeyModule(key) {
  const prefix = key.split(".")[0];
  const moduleMap = {
    common: "common.json",
    alert: "common.json",
    nav: "nav.json",
    superAdmin: "nav.json",
    settings: "settings.json",
    systemSettings: "systemSettings.json",
  };
  return moduleMap[prefix] || null;
}

/**
 * Merge new translations into existing files
 */
function mergeTranslations() {
  const filePath = validateArgs();

  console.log("\n 🔄 Merging translations (modular)...\n");

  try {
    // Load completed translations
    const completed = loadTranslations(filePath);

    // Load existing translations
    const enData = loadLanguageData("en");
    const esData = loadLanguageData("es");

    let merged = 0;
    let skipped = 0;

    // For each completed translation
    Object.entries(completed).forEach(([key, { en, es }]) => {
      if (!es || es === "[TRANSLATE_ME]" || es.trim() === "") {
        skipped++;
        return;
      }

      const module = getKeyModule(key);
      if (!module) {
        console.warn(`⚠️  Warning: Could not determine module for key "${key}"`);
        skipped++;
        return;
      }

      // Check if this is a new key (not in English)
      if (!enData[module] || !enData[module][key]) {
        console.warn(
          `⚠️  Warning: Key "${key}" not found in English ${module}`
        );
        skipped++;
        return;
      }

      // Add to Spanish translation
      if (!esData[module]) {
        esData[module] = {};
      }
      esData[module][key] = es;
      merged++;
    });

    // Write updated translations back to files
    Object.entries(esData).forEach(([file, translations]) => {
      const filePath = path.join(localesPath, "es", file);
      fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), "utf-8");
    });

    console.log(`✅ Successfully merged ${merged} new translations!`);
    if (skipped > 0) {
      console.log(`⏭️  Skipped ${skipped} entries (empty or invalid)`);
    }
    console.log("");
    console.log("📝 Next steps:");
    console.log("  1. Review changes in src/i18n/locales/es/");
    console.log("  2. Run: npm run check:translations");
    console.log("  3. Run: npm run format");
    console.log("  4. Commit your changes\n");
  } catch (error) {
    console.error("❌ Error merging translations:", error.message);
    process.exit(1);
  }
}

mergeTranslations();
