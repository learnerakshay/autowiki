import { expect, test } from "@playwright/test";

test("landing interactions remain accurate and complete with reduced motion", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Your repository, beautifully documented." })).toBeVisible();
  const repoField = page.getByRole("textbox", { name: /GitHub repository/ });
  await expect(repoField).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Sample Wiki" })).toHaveAttribute("href", "/wiki/sample/spoon-knife");
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

  // Inline validation: flagged while typing, before any submit.
  await repoField.fill("octo cat");
  await expect(repoField).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Repository names cannot contain spaces.")).toBeVisible();
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page).not.toHaveURL(/workspace/);

  // Valid input hands off to the workspace with the repository prefilled (and no job started).
  await repoField.fill("https://github.com/octocat/Spoon-Knife.git");
  await expect(repoField).toHaveAttribute("aria-invalid", "false");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace\?repo=octocat%2FSpoon-Knife$/);
  await expect(page.getByLabel("GitHub repository")).toHaveValue("octocat/Spoon-Knife");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".landing-shell")).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test("landing motion: tab swaps stay consistent, carousel takes drag and keys, pipeline fills with scroll", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Hero tab swap: rapid, interrupting clicks end on the last tab with one visible panel and no leftovers.
  await page.evaluate(() => window.scrollTo(0, 330));
  const names = ["Architecture diagrams", "Source context", "Wiki chapters", "Source context", "Architecture diagrams"];
  const centers = {};
  for (const name of new Set(names)) {
    const box = await page.getByRole("tab", { name }).boundingBox();
    centers[name] = [box.x + box.width / 2, box.y + box.height / 2];
  }
  for (const name of names) await page.mouse.click(...centers[name]);
  await expect(page.getByRole("tab", { name: "Architecture diagrams" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("[data-swap-panel]:visible")).toHaveCount(1);
  await expect(page.locator("[data-swap]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /demo animation/ })).toHaveAccessibleName("Play demo animation");

  // Carousel: arrow keys and a drag drive the same position as the pager.
  await page.locator("#explore").scrollIntoViewIfNeeded();
  const story = await page.evaluate(() => {
    const root = document.querySelector(".horizontal-story");
    return { start: root.getBoundingClientRect().top + window.scrollY };
  });
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), story.start);
  const frame = page.locator(".horizontal-story__frame");
  await expect(frame).toHaveAttribute("aria-roledescription", "carousel");
  await frame.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Open Web Structure" })).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".horizontal-scene").nth(0)).toHaveAttribute("aria-hidden", "true");
  await page.keyboard.press("Home");
  await expect(page.getByRole("button", { name: "Open Introduction" })).toHaveAttribute("aria-current", "true");
  const box = await frame.boundingBox();
  await page.mouse.move(box.x + 800, box.y + 14);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 14, { steps: 14 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Open Web Structure" })).toHaveAttribute("aria-current", "true");

  // Pipeline: nodes light in order as the strip scrolls in, and un-light when scrolling back up.
  const wrapTop = await page.evaluate(() => document.querySelector(".pipeline-wrap").getBoundingClientRect().top + window.scrollY);
  await page.evaluate((top) => window.scrollTo({ top: top - 380, behavior: "instant" }), wrapTop);
  await expect(page.locator(".pipeline li.is-active")).toHaveCount(6);
  await page.evaluate((top) => window.scrollTo({ top: top - 900, behavior: "instant" }), wrapTop);
  await expect(page.locator(".pipeline li.is-active")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
