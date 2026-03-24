#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesPath = path.join(__dirname, "..", "src", "i18n", "locales");
const pendingPath = path.join(__dirname, "..", "pending-translations.json");

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
 * Generate pending translations file
 */
function generatePendingTranslations() {
  console.log("\n 🔍 Analyzing pending translations...\n");

  try {
    const enTranslations = loadModularTranslations("en");
    const esTranslations = loadModularTranslations("es");

    // Find missing keys
    const pending = {};
    const missingKeys = Object.keys(enTranslations).filter(
      (key) => !esTranslations[key]
    );

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
        en: enTranslations[key],
        es: "[TRANSLATE_ME]",
      };
    });

    // Write to file
    fs.writeFileSync(pendingPath, JSON.stringify(pending, null, 2), "utf-8");

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
