import { test, expect } from "@playwright/test";
test("intake clarifies unknowns, rejects a hard constraint and filters without pretending AI ran", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your idea. A foundation that fits." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel("Your product idea")
    .fill("A client project tracker for freelance designers");
  await page.getByRole("button", { name: "Explore my foundations" }).click();
  await expect(
    page.getByRole("heading", { name: "A few things to clarify" }),
  ).toBeVisible();
  await page.getByLabel("Building experience").selectOption("comfortable");
  await page.getByLabel("Preferred language").selectOption("python");
  await page.getByRole("button", { name: "Explore my foundations" }).click();
  await expect(
    page.getByRole("heading", { name: "No supported match" }),
  ).toBeVisible();
  await page.getByLabel("Preferred language").selectOption("typescript");
  await page.getByLabel("Preferred framework").selectOption("nextjs");
  await page.locator("#accountModel").selectOption("individual");
  await page.getByLabel("Customer billing").selectOption("no");
  await page.getByLabel("File uploads").selectOption("no");
  await page.getByLabel("Background processing").selectOption("no");
  await page.getByLabel("Monthly infrastructure ceiling").fill("30");
  await page.locator("#hosting").selectOption("vercel");
  await page.getByLabel("Operating country").fill("India");
  await page.getByLabel("Can you use Supabase?").selectOption("eligible");
  await page.getByRole("button", { name: "Explore my foundations" }).click();
  // This local browser check expects the placeholder-only environment; it makes no model claims.
  await expect(
    page.getByRole("heading", { name: "Meta configuration required" }),
  ).toBeVisible();
  await expect(
    page.getByText("no AI recommendation was made", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Budget fit is unverified", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/intake-${test.info().project.name}.png`,
    fullPage: true,
  });
});
