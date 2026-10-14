import { expect, test } from "@playwright/test";

test("landing interactions remain accurate and complete with reduced motion", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const hero = page.locator(".landing-hero");
  await expect(page.getByRole("heading", { level: 1, name: "Your repository, beautifully documented." })).toBeVisible();
  const repoField = hero.getByRole("textbox", { name: /GitHub repository/ });
  await expect(repoField).toBeVisible();
  await expect(hero.getByRole("button", { name: "Generate a Wiki", exact: true })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Explore Sample Wiki" })).toHaveAttribute("href", "/wiki/sample/spoon-knife");
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
  await hero.getByRole("button", { name: "Generate a Wiki", exact: true }).click();
  await expect(page).not.toHaveURL(/workspace/);

  // Valid input hands off to the workspace with the repository prefilled (and no job started).
  await repoField.fill("https://github.com/octocat/Spoon-Knife.git");
  await expect(repoField).toHaveAttribute("aria-invalid", "false");
  await hero.getByRole("button", { name: "Generate a Wiki", exact: true }).click();
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
  await page.evaluate(() => window.dispatchEvent(new Event("landing:load-all")));
  await expect(page.locator(".horizontal-story")).toHaveCount(1);
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
  await expect(page.getByRole("button", { name: "Chapter 2: Web Structure" })).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".horizontal-scene").nth(0)).toHaveAttribute("aria-hidden", "true");
  await page.keyboard.press("Home");
  await expect(page.getByRole("button", { name: "Chapter 1: Introduction" })).toHaveAttribute("aria-current", "true");
  const box = await frame.boundingBox();
  await page.mouse.move(box.x + 800, box.y + 14);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 14, { steps: 14 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Chapter 2: Web Structure" })).toHaveAttribute("aria-current", "true");

  // Pipeline: nodes light in order as the strip scrolls in, and un-light when scrolling back up.
  const wrapTop = await page.evaluate(() => document.querySelector(".pipeline-wrap").getBoundingClientRect().top + window.scrollY);
  await page.evaluate((top) => window.scrollTo({ top: top - 380, behavior: "instant" }), wrapTop);
  await expect(page.locator(".pipeline li.is-active")).toHaveCount(6);
  await page.evaluate((top) => window.scrollTo({ top: top - 900, behavior: "instant" }), wrapTop);
  await expect(page.locator(".pipeline li.is-active")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("head, landmarks and brand config: real metadata, one h1, nothing invented", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/^AutoWiki: /);
  const meta = (selector) => page.locator(selector).getAttribute("content");
  expect(await meta('meta[name="description"]')).toContain("Mermaid diagrams");
  expect(await meta('meta[property="og:title"]')).toMatch(/^AutoWiki: /);
  expect(await meta('meta[property="og:image"]')).toBe("/og-image.jpg");
  expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  // No origin is configured, so no canonical / og:url is invented.
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCount(1);
  // Unconfigured footer extras are omitted entirely.
  await page.evaluate(() => window.dispatchEvent(new Event("landing:load-all")));
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("link", { name: /Source on GitHub/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to top" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("below-the-fold sections are code-split and load as they approach", async ({ page }) => {
  const chunks = [];
  page.on("request", (request) => { if (/FeaturesSection|FinalCta|PipelineSection/.test(request.url())) chunks.push(request.url()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(chunks).toEqual([]);
  await expect(page.locator(".features")).toHaveCount(0);
  // Jumping straight to the features anchor mounts that section (and only what is near it).
  await page.evaluate(() => document.getElementById("features").scrollIntoView({ behavior: "instant" }));
  await expect(page.locator(".features")).toHaveCount(1, { timeout: 20_000 });
  expect(chunks.some((url) => /FeaturesSection/.test(url))).toBe(true);
});

test("nav: CTA swaps in after the hero, scroll-spy follows, and the mobile sheet traps focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const nav = page.locator(".ln");
  await expect(nav).toHaveAttribute("data-past-hero", "false");
  await expect(page.locator(".ln__sample").first()).toBeVisible();
  await page.getByRole("link", { name: "Features", exact: true }).first().click();
  await expect(nav).toHaveAttribute("data-past-hero", "true");
  await expect(page.locator(".ln__primary").first()).toBeVisible();
  await expect(page.locator(".ln__links").getByRole("link", { name: "Features" })).toHaveAttribute("aria-current", "location");
  const progress = await page.locator(".ln__progress").evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
  expect(progress).toBeGreaterThan(0.1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.click();
  const sheet = page.getByRole("dialog", { name: "Menu" });
  await expect(sheet).toBeVisible();
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => Boolean(document.activeElement?.closest("#ln-sheet")) || document.activeElement?.classList.contains("ln__menu"));
    expect(inside).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});

test("repo input stays contained with very long, invalid and empty input", async ({ page }) => {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const field = page.locator(".landing-hero").getByRole("textbox", { name: /GitHub repository/ });
    await field.fill("x".repeat(400));
    await field.fill("bad owner!/" + "y".repeat(300));
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await field.fill("https://github.com/" + "a".repeat(80) + "/" + "b".repeat(150));
    await page.locator(".landing-hero").getByRole("button", { name: "Generate a Wiki", exact: true }).click();
    await field.fill("");
    await page.locator(".landing-hero").getByRole("button", { name: "Generate a Wiki", exact: true }).click();
    await expect(page.getByText("Enter a public GitHub repository")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
