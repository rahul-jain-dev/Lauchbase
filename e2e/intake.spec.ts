import { test, expect, type Page } from "@playwright/test";
import { screenshotPath } from "./screenshot-path";
import { ideaFields, type Proposal } from "../src/lib/idea-analysis";

test("five-case diagnostic preserves inputs and reports extraction independently from fit (fixtures)", async ({
  page,
}) => {
  const cases: string[] = [];
  await page.route("**/api/provider-diagnostics", async (route) => {
    const request = route.request().postDataJSON();
    cases.push(request.caseId);
    await route.fulfill({
      json: {
        success: true,
        caseId: request.caseId,
        provider: "openai-compatible",
        model: "fixture-not-live",
        assessment: {
          extractionPassed: true,
          catalogState:
            request.caseId === "unsupported"
              ? "unsupported"
              : "needs_clarification",
        },
      },
    });
  });
  await page.goto("/");
  await page
    .getByLabel("Your product idea")
    .fill("My original idea must stay in this form");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByText("Developer diagnostics", { exact: true }).click();
  await page.getByText("AI request timing tools", { exact: true }).click();
  await expect(
    page.getByText("This makes five analysis requests", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run five analysis checks" }).click();
  await expect(page.locator(".request-diagnostics pre")).toContainText(
    '"unsupported"',
  );
  await expect(
    page.getByRole("button", { name: "Run five analysis checks" }),
  ).toBeEnabled();
  expect(cases).toEqual([
    "individual",
    "agency",
    "ambiguous",
    "unsupported",
    "scheduled",
  ]);
  await page.getByRole("button", { name: "Close Settings" }).click();
  await expect(page.getByLabel("Your product idea")).toHaveValue(
    "My original idea must stay in this form",
  );
  await expect(
    page.locator(".request-diagnostics").getByRole("status"),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

const idea = "A client portal for ticket booking";
const fields = {
  account: "Will customers work independently",
  billing: "Does your product need to collect payments",
  uploads: "Will people upload or share files",
  background: "Does your product need scheduled processing",
};
async function fillNeeds(page: Page) {
  await page.getByLabel(fields.account).selectOption("individual");
  await page.getByLabel(fields.billing).selectOption("no");
  await page.getByLabel(fields.uploads).selectOption("no");
  await page.getByLabel(fields.background).selectOption("no");
}
function fixtureResponse(proposals: Proposal[]) {
  // Browser request interception only. Never used as runtime extraction or live Meta evidence.
  return {
    state: "analyzed",
    analysis: { proposals },
    meta: { model: "fixture-not-live-meta", calledAt: "2026-10-31T10:00:00Z" },
  };
}
const unknowns = (): Proposal[] =>
  ideaFields.map((field) => ({
    field,
    value: "unknown",
    kind: "unknown",
    essential: false,
    excerpt: null,
  }));

test("timeout and invalid output clear progress and retain answers; retry works (fixtures)", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByLabel("Your product idea").fill(idea);
  await page.getByLabel("Building experience").selectOption("beginner");
  await page.getByRole("button", { name: "Enter needs manually" }).click();
  await fillNeeds(page);
  for (const code of ["timeout", "invalid_output"]) {
    await page.route("**/api/analyze", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.fulfill({
        json: {
          state: "provider_error",
          analysis: null,
          meta: null,
          activeProvider: {
            provider: "gemini",
            profileId: "gemini",
            model: "fixture-not-live",
            ready: true,
            issue: {
              code,
              message:
                code === "timeout"
                  ? "Fixture provider timed out. Answers preserved."
                  : "Fixture returned invalid output.",
            },
          },
        },
      });
    });
    await page.getByRole("button", { name: "Understand my idea" }).click();
    await expect(
      page.getByText(
        "Asking the selected provider to propose requirements from your idea…",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name:
          code === "timeout"
            ? "Idea analysis timed out"
            : "Invalid model output",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Asking the selected provider to propose requirements from your idea…",
      ),
    ).toHaveCount(0);
    await expect(page.getByLabel("Your product idea")).toHaveValue(idea);
    await expect(page.getByLabel(fields.account)).toHaveValue("individual");
    await expect(
      page.getByRole("button", { name: "Understand my idea" }),
    ).toBeEnabled();
    await page.unroute("**/api/analyze");
  }
  await page.screenshot({
    path: screenshotPath(`timeout-error-${info.project.name}.png`),
    fullPage: true,
  });
  await page.route("**/api/analyze", (route) =>
    route.fulfill({ json: fixtureResponse(unknowns()) }),
  );
  await page.getByRole("button", { name: "Understand my idea" }).click();
  await expect(
    page
      .getByText("Your confirmed answer — kept when analyzing again.")
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Invalid model output", exact: true }),
  ).toHaveCount(0);
});

test("simple start, honest missing Meta state and manual comparison on desktop/mobile", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "From an idea to a buildable foundation." }),
  ).toBeVisible();
  expect(
    await page
      .locator("form input:visible, form textarea:visible, form select:visible")
      .count(),
  ).toBe(4);
  await expect(page.getByLabel("Preferred language")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Your product idea").fill(idea);
  await page.getByLabel("Building experience").selectOption("beginner");
  await page.screenshot({
    path: screenshotPath(`providers-initial-${info.project.name}.png`),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Understand my idea" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Idea analysis requires provider configuration",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("No AI extraction ran", { exact: false }),
  ).toBeVisible();
  await fillNeeds(page);
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: /Compare foundations|Recalculate foundation plan/,
    })
    .click();
  await expect(
    page
      .getByRole("heading", { name: "Individual-user SaaS", exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Your budget is not decided yet; no cost fit is established.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.locator("#results").getByText("Sign-in", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Proposed foundation — code has not been generated.", {
      exact: true,
    }),
  ).toHaveCount(1);
  await page.getByLabel("Monthly infrastructure budget").fill("0");
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: /Compare foundations|Recalculate foundation plan/,
    })
    .click();
  await expect(
    page
      .locator("#results")
      .getByText("Your budget ceiling is explicitly $0/month", {
        exact: false,
      }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: screenshotPath(`providers-results-${info.project.name}.png`),
    fullPage: true,
  });
});

test("inline clarification retains answers and guards changing an essential need", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Your product idea").fill(idea);
  await page.getByRole("button", { name: "Enter needs manually" }).click();
  await page.getByLabel(fields.account).selectOption("individual");
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Clarify these dependencies" }),
  ).toBeVisible();
  await expect(page.getByLabel(fields.account)).toHaveValue("individual");
  await expect(page.locator("#billing")).toBeVisible();
  await page.getByLabel(fields.billing).selectOption("required");
  await page.getByLabel(fields.uploads).selectOption("no");
  await page.getByLabel(fields.background).selectOption("no");
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: /Compare foundations|Recalculate foundation plan/,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Your essential needs exceed current catalog support",
    }),
  ).toBeVisible();
  await page.getByLabel(fields.billing).selectOption("no");
  await expect(page.getByLabel(fields.billing)).toHaveValue("required");
  await page.getByRole("button", { name: "Keep original requirement" }).click();
  await expect(page.getByLabel(fields.billing)).toHaveValue("required");
  await page.getByLabel(fields.billing).selectOption("optional");
  await page
    .getByRole("button", { name: "Confirm requirement change" })
    .click();
  await expect(page.getByLabel(fields.billing)).toHaveValue("optional");
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: /Compare foundations|Recalculate foundation plan/,
    })
    .click();
  await expect(page.getByLabel(fields.account)).toHaveValue("individual");
});

test("ambiguous extraction fixture stays unknown; explicit answers override later suggestions", async ({
  page,
}) => {
  let useSuggestion = false;
  await page.route("**/api/analyze", async (route) => {
    const proposals = unknowns();
    if (useSuggestion)
      proposals[0] = {
        field: "accountModel",
        value: "team",
        kind: "suggested",
        essential: false,
        excerpt: idea,
      };
    await route.fulfill({ json: fixtureResponse(proposals) });
  });
  await page.goto("/");
  await page.getByLabel("Your product idea").fill(idea);
  await page.getByRole("button", { name: "Understand my idea" }).click();
  await expect(
    page.getByRole("heading", { name: "Our proposed understanding" }),
  ).toBeVisible();
  for (const label of Object.values(fields))
    await expect(page.getByLabel(label)).toHaveValue("unknown");
  await page.getByLabel(fields.account).selectOption("individual");
  useSuggestion = true;
  await page.getByRole("button", { name: "Understand my idea" }).click();
  await expect(page.getByLabel(fields.account)).toHaveValue("individual");
  await expect(
    page.getByRole("button", { name: "Confirm: In shared workspaces" }),
  ).toHaveCount(0);
});

test("unsupported extraction fixture requires review and preserves essential payments", async ({
  page,
}) => {
  const explicitIdea = "Customers must pay for each ticket when booking.";
  await page.route("**/api/analyze", async (route) => {
    const proposals = unknowns();
    proposals[1] = {
      field: "billing",
      value: "required",
      kind: "explicitly_stated",
      essential: true,
      excerpt: explicitIdea,
    };
    await route.fulfill({ json: fixtureResponse(proposals) });
  });
  await page.goto("/");
  await page.getByLabel("Your product idea").fill(explicitIdea);
  await page.getByRole("button", { name: "Understand my idea" }).click();
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await expect(
    page.getByText("Review the essential interpretations below", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByLabel(fields.billing)).toHaveValue("unknown");
  await page
    .getByRole("button", {
      name: "Confirm essential need: Essential",
      exact: true,
    })
    .click();
  await page.getByLabel(fields.account).selectOption("individual");
  await page.getByLabel(fields.uploads).selectOption("no");
  await page.getByLabel(fields.background).selectOption("no");
  await page
    .getByRole("button", { name: "Confirm scope", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: /Compare foundations|Recalculate foundation plan/,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Your essential needs exceed current catalog support",
    }),
  ).toBeVisible();
  await expect(page.getByLabel(fields.billing)).toHaveValue("required");
  await page
    .getByText("Supporting excerpts & original interpretations", {
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("blockquote").filter({ hasText: explicitIdea }).first(),
  ).toBeVisible();
});

test("active configuration changes do not relabel previous inference attribution (fixtures)", async ({
  page,
}) => {
  let selected: "meta" | "gemini" = "meta";
  await page.route("**/api/provider", (route) =>
    route.fulfill({
      json: {
        provider: selected,
        model: "fixture-model",
        ready: true,
        issue: null,
      },
    }),
  );
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      json: {
        ...fixtureResponse(unknowns()),
        meta: {
          provider: selected,
          model: `${selected}-fixture-model`,
          requestedModel: `${selected}-fixture-model`,
          calledAt: "2026-10-31T10:00:00Z",
        },
        activeProvider: {
          provider: selected,
          model: `${selected}-fixture-model`,
          ready: true,
          issue: null,
        },
      },
    }),
  );
  await page.goto("/");
  await page.getByLabel("Your product idea").fill(idea);
  await page.getByRole("button", { name: "Understand my idea" }).click();
  selected = "gemini";
  await page.getByRole("button", { name: "Understand my idea" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByText("Developer diagnostics", { exact: true }).click();
  await page
    .getByText("Safe provider, model, contract and verification evidence")
    .click();
  await expect(page.locator(".developer-diagnostics pre").last()).toContainText(
    "meta-fixture-model",
  );
  await expect(page.locator(".developer-diagnostics pre").last()).toContainText(
    "gemini-fixture-model",
  );
});
