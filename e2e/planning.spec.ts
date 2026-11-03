import { test, expect, type Page } from "@playwright/test";
import { screenshotPath } from "./screenshot-path";
import { ideaFields, type Proposal } from "../src/lib/idea-analysis";
const idea =
  "An agency client portal with private uploads, deliverable reviews and milestone approvals. Clients must only access their own projects. No payments or background processing.";
async function needs(page: Page, team = false) {
  await page
    .getByLabel("Will customers work independently")
    .selectOption(team ? "team" : "individual");
  await page
    .getByLabel("Does your product need to collect payments")
    .selectOption("no");
  await page
    .getByLabel("Will people upload or share files")
    .selectOption(team ? "required" : "no");
  await page
    .getByLabel("Does your product need scheduled processing")
    .selectOption("no");
}
test("confirmed agency workflows produce a plan, honest map and build review; edits stale the plan (fixtures)", async ({
  page,
}, info) => {
  // Synthetic analysis only; recommendations use real deterministic catalog filtering.
  const proposals: Proposal[] = ideaFields.map((field) => ({
    field,
    value: "unknown",
    kind: "unknown",
    essential: false,
    excerpt: null,
  }));
  proposals.push(
    {
      field: "hardRequirement",
      value: "Review deliverables",
      kind: "explicitly_stated",
      essential: true,
      category: "product_workflow",
      dependencies: ["workspaces", "saved_records", "private_files"],
      excerpt: idea,
    },
    {
      field: "hardRequirement",
      value: "Approve milestones",
      kind: "explicitly_stated",
      essential: true,
      category: "product_workflow",
      dependencies: ["saved_records", "project_permissions"],
      excerpt: idea,
    },
  );
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      json: {
        state: "analyzed",
        analysis: { proposals },
        meta: {
          provider: "meta",
          model: "fixture-not-live",
          calledAt: "2026-11-01T00:00:00Z",
        },
      },
    }),
  );
  await page.goto("/");
  await page.getByLabel("Your product idea").fill(idea);
  await page.getByRole("button", { name: "Understand my idea" }).click();
  await needs(page, true);
  await expect(
    page.getByRole("button", { name: "Compare foundations" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await expect(page.locator(".workspace > .notice.error")).toContainText(
    "Review the essential interpretations",
  );
  await page
    .getByRole("button", { name: "Confirm this scope item" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Confirm this scope item" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your confirmed product scope" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Compare foundations" }).click();
  const result = page.locator("#results");
  await expect(
    result.getByRole("heading", {
      name: "Team / client-portal SaaS",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    result.getByText("Proposed foundation — code has not been generated.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    result.getByText("Essential: Review deliverables", { exact: false }),
  ).toBeVisible();
  await expect(result.getByRole("alert")).toContainText(
    "Workspace membership alone is insufficient",
  );
  expect(
    await page.evaluate(() =>
      Boolean(
        document
          .getElementById("understanding")!
          .compareDocumentPosition(document.getElementById("results")!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ),
  ).toBe(true);
  await result.getByRole("button", { name: "Review build plan" }).click();
  await result.getByLabel("Operating system").selectOption("windows");
  await result.getByLabel("Editor or coding agent").selectOption("Cursor");
  await result
    .getByLabel("Optional planning assistant")
    .selectOption("ChatGPT");
  await result.getByLabel("Repository preference").selectOption("GitHub");
  await result
    .getByRole("button", { name: "How you build and run it" })
    .click();
  await result
    .locator(".map-nodes summary")
    .filter({ hasText: "Supabase service account" })
    .click();
  await result
    .getByLabel("Your ownership: Supabase service account")
    .selectOption("have_account");
  await expect(
    result
      .locator(".map-nodes > li")
      .filter({ hasText: "Supabase service account" })
      .getByText("Ownership is user-reported.", { exact: false }),
  ).toBeVisible();
  await expect(
    result
      .locator(".map-nodes > li")
      .filter({ hasText: "Supabase service account" })
      .getByText("Execution / verification:", { exact: false })
      .locator(".."),
  ).toContainText("planned");
  await expect(
    result.locator(".map-nodes summary").filter({ hasText: "ChatGPT" }),
  ).toBeVisible();
  await expect(
    result.getByRole("button", { name: /^Build project|Generate|Download/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await result.locator(".project-map").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: screenshotPath(`planning-map-${info.project.name}.png`),
    fullPage: false,
  });
  await page.screenshot({
    path: screenshotPath(`planning-development-${info.project.name}.png`),
    fullPage: true,
  });
  await result
    .getByRole("button", { name: "How your application works" })
    .click();
  await result
    .locator(".map-nodes summary")
    .filter({ hasText: "Private file storage" })
    .click();
  await expect(result.locator(".map-nodes")).not.toContainText("ChatGPT");
  await page.screenshot({
    path: screenshotPath(`planning-application-${info.project.name}.png`),
    fullPage: true,
  });
  await page.getByLabel("Monthly infrastructure budget").fill("25");
  await expect(page.getByText("Plan outdated", { exact: false })).toBeVisible();
  await expect(page.locator("#results")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Review build plan" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Recalculate foundation plan" })
    .click();
  await expect(page.locator("#results")).toBeVisible();
  const scopeItem = page.locator(".scope-item").first();
  await scopeItem
    .getByLabel("Confirmed requirement")
    .fill("Review design deliverables");
  await scopeItem
    .getByRole("button", { name: "Save requirement changes" })
    .click();
  await page
    .getByRole("button", { name: "Confirm requirement change" })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirm this scope item" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Recalculate foundation plan" })
    .click();
  await expect(
    page
      .locator("#results")
      .getByText("Essential: Review design deliverables", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByText("Developer diagnostics", { exact: true }).click();
  await page
    .getByText("Safe provider, model, contract and verification evidence")
    .click();
  await expect(page.locator(".developer-diagnostics pre").last()).toContainText(
    "foundation-plan-v1",
  );
  await expect(page.locator(".developer-diagnostics pre").last()).toContainText(
    '"buildReadiness": "blocked"',
  );
});
test("essential Salesforce and scheduled workflow dependencies remain blockers (fixtures)", async ({
  page,
}) => {
  for (const dependency of ["external_service", "background"] as const) {
    await page.goto("/");
    await page
      .getByLabel("Your product idea")
      .fill(
        dependency === "background"
          ? "Contact manager must send scheduled reminders"
          : "Contact manager must synchronize Salesforce",
      );
    await page.getByRole("button", { name: "Enter needs manually" }).click();
    await needs(page);
    await page
      .getByText(
        "Add a product workflow, capability, integration or constraint manually",
        { exact: true },
      )
      .click();
    const manual = page.locator(".scope-review > details");
    await manual
      .getByLabel("Additional scope requirement")
      .fill(
        dependency === "background"
          ? "Send scheduled reminders"
          : "Synchronize Salesforce",
      );
    await manual
      .getByLabel(
        dependency === "background"
          ? "Scheduled or long-running background work"
          : "An external integration",
        { exact: true },
      )
      .check();
    await manual
      .getByRole("button", { name: "Add confirmed requirement" })
      .click();
    await page
      .getByRole("button", { name: "Confirm scope", exact: true })
      .click();
    await page.getByRole("button", { name: "Compare foundations" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Your essential needs exceed current catalog support",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Review build plan" }),
    ).toHaveCount(0);
    await expect(page.getByLabel("Confirmed requirement")).toHaveValue(
      dependency === "background"
        ? "Send scheduled reminders"
        : "Synchronize Salesforce",
    );
  }
});
