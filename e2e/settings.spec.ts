import { test, expect } from "@playwright/test";
import { screenshotPath } from "./screenshot-path";
import type { ConnectionView } from "../src/lib/connections";
import { freshChecks, checksPassed } from "../src/lib/connections";
const empty = (): ConnectionView => ({
  profileId: null,
  keyConfigured: false,
  expiresAt: null,
  authentication: "unknown",
  models: [],
  listing: "not_loaded",
  listedAt: null,
  selectedModel: null,
  active: false,
  test: null,
  checks: null,
  issue: null,
});

test("AI connections settings: connect, search, test, activate, replace and preserve intake (UI fixtures)", async ({
  page,
}, info) => {
  // Intercepted settings state is only a browser UI fixture. Server lifecycle and
  // session isolation use real route handlers in connections.test.ts.
  let view = empty();
  let failTest = true;
  const fixtureKey = "AIza-test-fixture-not-a-real-key";
  const stamp = "2026-10-31T10:00:00Z";
  await page.route("**/api/connections", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      if (body.action === "connect")
        view = {
          ...empty(),
          profileId: body.profileId,
          keyConfigured: true,
          authentication: "verified",
          listing: "listed",
          listedAt: stamp,
          expiresAt: "2026-10-31T18:00:00Z",
          models: [
            {
              id: "gemini-3.8-flash",
              name: "Gemini text fixture",
              textOutput: null,
              structuredOutput: null,
              supportedActions: ["generateContent"],
              inputTokenLimit: null,
              outputTokenLimit: null,
              selectable: true,
              reason: null,
            },
            {
              id: "gemini-3.5-flash-lite",
              name: "Another text fixture",
              textOutput: null,
              structuredOutput: null,
              supportedActions: ["generateContent"],
              inputTokenLimit: null,
              outputTokenLimit: null,
              selectable: true,
              reason: null,
            },
            {
              id: "imagen-fixture",
              name: "Image fixture",
              textOutput: false,
              structuredOutput: null,
              supportedActions: [],
              inputTokenLimit: null,
              outputTokenLimit: null,
              selectable: false,
              reason: "Provider metadata reports no text output.",
            },
          ],
        };
      if (body.action === "select")
        view = {
          ...view,
          selectedModel: body.model,
          test: null,
          checks: null,
          active: false,
          issue: null,
        };
      if (body.action === "test") {
        if (failTest) {
          const checks = freshChecks();
          checks.analysis = {
            state: "failed",
            meta: null,
            issue: {
              code: "billing_quota",
              message: "Fixture: credits unavailable; check billing.",
            },
          };
          view = {
            ...view,
            test: null,
            active: false,
            checks,
            issue: {
              code: "billing_quota",
              message: "Fixture: credits unavailable; check billing.",
            },
          };
          failTest = false;
        } else {
          const evidence = {
            provider: "gemini" as const,
            profileId: "gemini",
            model: view.selectedModel!,
            requestedModel: view.selectedModel!,
            calledAt: stamp,
          };
          const checks = view.checks ?? freshChecks();
          checks[body.operation as "analysis" | "ranking"] = {
            state: "passed",
            meta: evidence,
            issue: null,
          };
          view = {
            ...view,
            issue: null,
            checks,
            test: checksPassed(checks) ? evidence : null,
            active: false,
          };
        }
      }
      if (body.action === "activate")
        view = { ...view, active: Boolean(view.test) };
      if (body.action === "disconnect") view = empty();
    }
    await route.fulfill({ json: view });
  });
  await page.route("**/api/provider", (route) =>
    route.fulfill({
      json: {
        provider: view.keyConfigured ? "gemini" : null,
        model: view.selectedModel,
        ready: view.active,
        profileId: view.profileId ?? undefined,
        issue: null,
      },
    }),
  );
  await page.goto("/");
  await page
    .getByLabel("Your product idea")
    .fill("A personal contact tracker for independent customers");
  await page.getByRole("button", { name: "Enter needs manually" }).click();
  await page
    .getByLabel("Will customers work independently")
    .selectOption("individual");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const panel = page.getByRole("dialog");
  await expect(
    panel.getByRole("heading", { name: "AI connections" }),
  ).toBeVisible();
  await expect(
    panel.getByText(
      "Connection lasts for this session. Reconnect after the server restarts.",
    ),
  ).toBeVisible();
  await panel.getByLabel("API key").fill(fixtureKey);
  await expect(
    panel.getByText("Key format suggests Gemini", { exact: false }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Connect", exact: true }),
  ).toBeDisabled();
  await panel
    .getByRole("combobox", { name: "Provider", exact: true })
    .selectOption("gemini");
  await panel.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(panel.getByText("Key configured · value hidden")).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Use this connection" }),
  ).toBeDisabled();
  await panel.getByLabel("Search models").fill("3.8");
  await panel
    .getByRole("combobox", { name: "Model", exact: true })
    .selectOption("gemini-3.8-flash");
  await expect(
    panel.getByText("Structured-output metadata: not provided", {
      exact: false,
    }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Refresh models" }).click();
  await expect(panel.locator(".credit-note")).toBeVisible();
  await panel.getByRole("button", { name: "Test selected model" }).click();
  await expect(panel.getByRole("alert")).toContainText("billing quota");
  await expect(panel.getByText("Idea-analysis check: failed")).toBeVisible();
  await expect(
    panel.getByText("Foundation-ranking check: planned"),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Use this connection" }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Test selected model" }).click();
  await expect(
    panel.getByRole("button", { name: "Use this connection" }),
  ).toBeEnabled();
  await expect(panel.getByText("Idea-analysis check: passed")).toBeVisible();
  await expect(
    panel.getByText("Foundation-ranking check: passed"),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Use this connection" }).click();
  await expect(
    panel.getByText("Active for both AI operations: Yes — ready"),
  ).toBeVisible();
  await expect(panel.getByLabel("API key")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      JSON.stringify({
        local: { ...localStorage },
        session: { ...sessionStorage },
      }),
    ),
  ).not.toContain(fixtureKey);
  expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  const bounds = (await panel.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(
    Math.abs(bounds.x + bounds.width / 2 - viewport.width / 2),
  ).toBeLessThan(2);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  await panel.evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({
    path: screenshotPath(`settings-active-${info.project.name}.png`),
    fullPage: false,
  });
  await panel.getByRole("button", { name: "Close Settings" }).click();
  await expect(page.getByLabel("Your product idea")).toHaveValue(
    "A personal contact tracker for independent customers",
  );
  await expect(
    page.getByLabel("Will customers work independently"),
  ).toHaveValue("individual");
  await expect(
    page.getByText("AI understanding is available.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await panel.getByLabel("Search models").fill("");
  await panel
    .getByRole("combobox", { name: "Model", exact: true })
    .selectOption("gemini-3.5-flash-lite");
  await expect(
    panel.getByRole("button", { name: "Use this connection" }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Replace key" }).click();
  await expect(panel.getByLabel("API key")).toHaveValue("");
  await expect(
    panel.getByText("No key configured for this session"),
  ).toBeVisible();
  await panel.getByLabel("API key").fill(fixtureKey);
  await panel.getByRole("button", { name: "Connect", exact: true }).click();
  await panel.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(
    panel.getByText("No key configured for this session"),
  ).toBeVisible();
  await panel
    .getByRole("combobox", { name: "Provider", exact: true })
    .selectOption("openai");
  await panel.getByLabel("API key").fill("sk-ambiguous-fixture");
  await expect(
    panel.getByText("Key format is ambiguous", { exact: false }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Close Settings" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(panel.getByLabel("API key")).toHaveValue("");
});
