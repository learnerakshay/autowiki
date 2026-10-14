import { expect, test } from "@playwright/test";

// App shell + design-system primitives. The shell tests run against any build; the primitive tests need the dev-only
// /dev/ui gallery (it is not in production builds), so they skip themselves when it is not served:
//   BASE_URL=http://localhost:5173 npx playwright test design-system.spec.js

const ready = (page) => expect(page.locator(".route-viewport")).toHaveAttribute("data-ready", "true");
const route = (page, key) => expect(page.locator(".route-viewport")).toHaveAttribute("data-route", key);
const nav = (page, name) => page.getByRole("link", { name, exact: true }).first();

async function openGallery(page) {
  await page.goto("/dev/ui");
  const present = await page.locator(".gl-main").waitFor({ timeout: 4000 }).then(() => true, () => false);
  test.skip(!present, "the /dev/ui gallery is only served by the dev server");
}

test("app nav: the active item follows the route, including the nested sample wiki", async ({ page }) => {
  for (const [path, label] of [["/workspace", "Workspace"], ["/chat", "Chat"], ["/wiki", "Wiki"], ["/wiki/sample/spoon-knife", "Wiki"], ["/architecture", "Architecture"]]) {
    await page.goto(path);
    await ready(page);
    await expect(page.locator('.ln__links [aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.ln__links [aria-current="page"]')).toHaveText(label);
  }
});

test("app nav: the Generate a Wiki CTA is hidden on the Workspace and lands on its repository field elsewhere", async ({ page }) => {
  await page.goto("/workspace");
  await ready(page);
  await expect(page.locator(".ln__primary").first()).toHaveAttribute("data-hidden", "true");
  await page.goto("/chat");
  await ready(page);
  await page.locator(".ln__primary").first().click();
  await route(page, "workspace");
  await expect(page.locator("#repo")).toBeFocused();
});

test("route change: focus moves to the new page's h1, the title is announced, scroll resets, nav and footer persist", async ({ page }) => {
  await page.goto("/chat");
  await ready(page);
  const navHandle = await page.locator(".ln").elementHandle();
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
  await nav(page, "Workspace").click();
  await route(page, "workspace");
  await expect(page.locator("h1").first()).toBeFocused();
  await expect(page.locator('[role="status"][aria-live="polite"]').last()).toContainText("What will we document today?");
  await expect(page).toHaveTitle('Workspace — AutoWiki');
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  expect(await navHandle.evaluate((element) => element.isConnected)).toBe(true); // the nav was not remounted
});

test("route change: the first page load leaves focus at the start of the document (skip link is the first tab stop)", async ({ page }) => {
  await page.goto("/chat");
  await ready(page);
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("route change: back and forward restore the scroll position", async ({ page }) => {
  await page.goto("/architecture");
  await ready(page);
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: "instant" }));
  await nav(page, "Chat").click();
  await route(page, "chat");
  await page.goBack();
  await route(page, "architecture");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(640);
});

test("route change: rapid clicking always settles on the last route and never drops a click", async ({ page }) => {
  await page.goto("/workspace");
  await ready(page);
  for (const name of ["Chat", "Wiki", "Architecture", "Workspace", "Chat", "Architecture", "Wiki"]) await nav(page, name).click({ force: true });
  await route(page, "wiki");
  await expect(page).toHaveURL(/\/wiki$/);
  await expect(page.locator('.ln__links [aria-current="page"]')).toHaveText("Wiki");
  await expect(page.locator(".route-viewport")).toHaveCSS("opacity", "1");
});

test("route change: under reduced motion the page cross-fades in 0.18s with no movement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/chat");
  await ready(page);
  await nav(page, "Wiki").click();
  const animations = await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(
    document.querySelector(".route-viewport").getAnimations().map((a) => ({ duration: a.effect.getComputedTiming().duration, transform: a.effect.getKeyframes().some((k) => "transform" in k) })),
  )))));
  expect(animations.length).toBeGreaterThan(0);
  expect(animations.every((a) => a.duration <= 200 && !a.transform)).toBe(true);
});

test("app nav on mobile: the menu traps focus, Esc closes it and returns focus, a link navigates and closes it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  await ready(page);
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await expect(page.locator("#main-content")).toHaveAttribute("inert", "");
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement.closest("#ln-sheet") || document.activeElement.classList.contains("ln__menu"))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.getByRole("button", { name: "Open menu" }).click();
  await menu.getByRole("link", { name: "Architecture" }).click();
  await route(page, "architecture");
  await expect(page.locator(".ln")).toHaveAttribute("data-open", "false");
});

test("app shell: no layout shift while any route loads", async ({ page }) => {
  for (const path of ["/workspace", "/chat", "/wiki", "/architecture"]) {
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(path);
    await ready(page);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__cls)).toBe(0);
  }
});

// ───────── Primitives (dev gallery) ─────────

test("tabs: arrow keys, Home and End move and select; only the active tab is in the tab order", async ({ page }) => {
  await openGallery(page);
  await page.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Sources" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Diagram" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  expect(await page.getByRole("tab").evaluateAll((tabs) => tabs.filter((tab) => tab.tabIndex === 0).length)).toBe(1);
});

test("dialog: focus is trapped, the app behind is inert, Esc closes, focus returns to the trigger", async ({ page }) => {
  await openGallery(page);
  const trigger = page.getByRole("button", { name: "Open dialog" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Discard this draft?" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("#root")).toHaveAttribute("inert", "");
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("button: a disabled button with a reason stays focusable and explains itself; loading is busy, not a percentage", async ({ page }) => {
  await openGallery(page);
  const explained = page.getByRole("button", { name: "Disabled, explained" }).first();
  await explained.focus();
  await expect(page.getByRole("tooltip")).toContainText("Enter a repository first");
  await expect(explained).toHaveAttribute("aria-disabled", "true");
  const loading = page.getByRole("button", { name: "Generating" }).first();
  await expect(loading).toHaveAttribute("aria-busy", "true");
  expect(await loading.textContent()).not.toMatch(/%/);
});

test("toast: stacks, is announced politely, and a swipe dismisses it", async ({ page }) => {
  await openGallery(page);
  await page.getByRole("button", { name: "Info toast" }).click();
  await page.getByRole("button", { name: "Success toast" }).click();
  await expect(page.locator(".ui-toast")).toHaveCount(2);
  await expect(page.locator('.ui-toast [role="status"]')).toHaveCount(2);
  await expect(page.locator('.ui-toast [role="status"]').first()).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('.ui-toast [role="status"]').last()).toHaveAttribute('aria-live', 'polite');
  const box = await page.locator(".ui-toast").last().boundingBox();
  await page.mouse.move(box.x + 40, box.y + box.height / 2);
  await page.mouse.down();
  for (let step = 1; step <= 8; step += 1) await page.mouse.move(box.x + 40 + step * 40, box.y + box.height / 2);
  await page.mouse.up();
  await expect(page.locator(".ui-toast")).toHaveCount(1);
});

test("field: validation runs while typing and clears when the value is fixed", async ({ page }) => {
  await openGallery(page);
  const field = page.getByLabel("Repository").first();
  await field.fill("bad owner!/x");
  await expect(page.locator(".ui-field__message").first()).toContainText("cannot contain spaces");
  await field.fill("octocat/Spoon-Knife");
  await expect(page.locator(".ui-field__message").first()).toHaveText("");
});
