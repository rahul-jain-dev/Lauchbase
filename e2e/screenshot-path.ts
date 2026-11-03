import { join } from "node:path";

// Routine checks must not replace committed, reviewed fixture screenshots.
export function screenshotPath(filename: string) {
  return join(
    process.env.PLAYWRIGHT_SCREENSHOT_DIR || "artifacts/screenshots",
    filename,
  );
}
