import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, "..", "src", "data", "dashboards");
const destDir = path.join(__dirname, "..", "dist", "data", "dashboards");

try {
  // Ensure destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy all dashboard files
  fs.cpSync(srcDir, destDir, { recursive: true });

  console.log("✅ Dashboard files copied to dist/data/dashboards/");
} catch (error) {
  console.error("❌ Error copying dashboard files:", error);
  process.exit(1);
}
