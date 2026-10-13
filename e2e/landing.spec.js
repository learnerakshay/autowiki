import { expect, test } from "@playwright/test";

test("landing interactions remain accurate and complete with reduced motion", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Your repository, beautifully documented." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Generate a Wiki" })).toHaveAttribute("href", "/workspace");
  await expect(page.getByText("octocat / Spoon-Knife", { exact: true })).toBeVisible();
  await expect(page.getByText("3 chapters", { exact: true })).toBeVisible();
  await expect(page.getByText("Source path", { exact: true })).toBeVisible();

  const exploreLink = page.getByRole("link", { name: "How it works" }).first();
  await expect(exploreLink).toHaveAttribute("href", "#how-it-works");
  await exploreLink.click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await expect(page.getByRole("heading", { name: "From repository to documentation." })).toBeVisible();

  const tabs = page.getByRole("tab");
  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Source context");
  await tabs.nth(1).click();
  await expect(page.getByRole("tabpanel")).toContainText("The chapter diagram is generated from the same source context as the explanation.");
  await expect(page.locator(".product-window__document")).toHaveCount(1);
  await expect(page.locator(".product-diagram").first()).toBeVisible();

  await page.getByRole("link", { name: "Generate a Wiki" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".landing-shell")).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});
