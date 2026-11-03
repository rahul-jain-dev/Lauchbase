import { defineConfig, devices } from "@playwright/test";
const windows = process.platform === "win32";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    channel: process.env.PLAYWRIGHT_CHANNEL || (windows ? "msedge" : undefined),
    headless: true,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices[windows ? "Desktop Edge" : "Desktop Chrome"] },
    },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "pnpm start --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    env: {
      AI_PROVIDER: "meta",
      META_MODEL: "muse-spark-1.3",
      META_API_KEY: "replace_with_browser_test_placeholder",
    },
  },
});
