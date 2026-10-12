import { expect, test } from "@playwright/test";

test("landing interactions remain accurate and complete with reduced motion", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Your repository. Beautifully documented." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Generate a Wiki" })).toHaveAttribute("href", "/workspace");
  await expect(page.getByText("Generated from Spoon-Knife", { exact: true })).toBeVisible();
  await expect(page.getByText("3 chapters · read-only", { exact: true })).toBeVisible();
  await expect(page.getByText("Source paths", { exact: true })).toBeVisible();

  const exploreLink = page.getByRole("link", { name: "Explore How It Works" });
  await expect(exploreLink).toHaveAttribute("href", "#how-it-works");
  await exploreLink.click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await expect(page.getByRole("heading", { name: "From repository to documentation." })).toBeVisible();

  const tabs = page.getByRole("tab");
  await tabs.nth(1).click();
  await tabs.nth(2).click();
  await tabs.nth(0).click();
  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Styling");
  await expect(page.locator(".landing-preview__document")).toHaveCount(1);
  await expect(page.locator(".landing-preview__diagram")).toHaveCount(1);

  await page.getByRole("link", { name: "Generate a Wiki" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".landing-shell")).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});
