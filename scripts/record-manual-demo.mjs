// Honest local footage: real UI/API, manual requirements, no provider fixtures or keys.
// Start the production app at http://127.0.0.1:3200 before running this script.
import { chromium } from "@playwright/test";
import { mkdir, writeFile, copyFile } from "node:fs/promises";

const directory = "artifacts/submission-demo";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  channel: process.platform === "win32" ? "msedge" : undefined,
  slowMo: 150,
});
let context;
try {
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: { dir: directory, size: { width: 1440, height: 1000 } },
  });
  await context.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const label = document.createElement("div");
      label.textContent =
        "MANUAL INPUT DEMO · NO AI REQUESTS · PROPOSED FOUNDATION";
      label.style.cssText =
        "position:fixed;bottom:0;left:0;right:0;background:#173b32;color:white;padding:10px;text-align:center;font:14px sans-serif;z-index:99999;pointer-events:none";
      document.body.append(label);
    });
  });
  const page = await context.newPage();
  let analysisRequests = 0;
  let comparisonRequests = 0;
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path === "/api/analyze") analysisRequests++;
    if (path === "/api/recommend" && request.method() === "POST")
      comparisonRequests++;
  });
  await page.goto("http://127.0.0.1:3200", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page
    .getByLabel("Your product idea")
    .fill(
      "A freelance design agency client portal. Team members invite clients, share private design PDFs and collect project feedback. Clients should only see their assigned projects. No customer payments or background processing initially.",
    );
  await page.getByLabel("Building experience").selectOption("beginner");
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Enter needs manually" }).click();
  await page
    .getByLabel("Will customers work independently")
    .selectOption("team");
  await page
    .getByLabel("Does your product need to collect payments")
    .selectOption("no");
  await page
    .getByLabel("Will people upload or share files")
    .selectOption("required");
  await page
    .getByLabel("Does your product need scheduled processing")
    .selectOption("no");
  await page
    .getByText(
      "Add a product workflow, capability, integration or constraint manually",
      { exact: true },
    )
    .click();
  const manual = page.locator(".scope-review > details");
  await manual
    .getByLabel("Additional scope requirement")
    .fill("Collect feedback on private design projects");
  for (const name of [
    "Saved database records",
    "Private file uploads",
    "Project-level client permissions",
  ])
    await manual.getByLabel(name, { exact: true }).check();
  await manual
    .getByRole("button", { name: "Add confirmed requirement" })
    .click();
  await page.waitForTimeout(1800);
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Compare foundations" }).click();
  const results = page.locator("#results");
  await results
    .getByRole("heading", { name: "Team / client-portal SaaS", exact: true })
    .waitFor();
  await results.scrollIntoViewIfNeeded();
  await page.waitForTimeout(4000);
  await page.screenshot({
    path: `${directory}/manual-foundation-plan.png`,
    fullPage: true,
  });
  await results.locator(".project-map").scrollIntoViewIfNeeded();
  await results
    .locator(".map-nodes summary")
    .filter({ hasText: "Private file storage" })
    .click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${directory}/manual-application-map.png` });
  await results.getByRole("button", { name: "Review build plan" }).click();
  await results.getByLabel("Operating system").selectOption("windows");
  await results.getByLabel("Editor or coding agent").selectOption("Cursor");
  await results
    .getByRole("button", { name: "How you build and run it" })
    .click();
  await results.locator(".project-map").scrollIntoViewIfNeeded();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${directory}/manual-development-map.png` });
  await results.locator(".build-review").scrollIntoViewIfNeeded();
  await page.waitForTimeout(4000);
  if (analysisRequests !== 0 || comparisonRequests < 1)
    throw new Error(
      "Unexpected recording path; do not label this as the manual demo.",
    );
  const video = page.video();
  await context.close();
  context = null;
  await copyFile(
    await video.path(),
    `${directory}/saasfoundation-manual-demo.webm`,
  );
  await writeFile(
    `${directory}/evidence.json`,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        name: "SaaSFoundation",
        source: "real local production UI and deterministic API",
        manualInput: true,
        liveInference: false,
        providerFixtures: false,
        analysisRequests,
        comparisonRequests,
        limitations: [
          "Silent local manual-path footage",
          "No AI/provider verification",
          "No deployment or generated code",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "Recorded real manual-input footage: artifacts/submission-demo/saasfoundation-manual-demo.webm",
  );
} finally {
  if (context) await context.close();
  await browser.close();
}
