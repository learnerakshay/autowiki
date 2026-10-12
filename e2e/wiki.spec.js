import { expect, test } from "@playwright/test";

test("wiki replaces chapter content and keeps exactly one Mermaid SVG", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({ path: "screenshots/home.png", fullPage: true });
  await page.getByLabel("GitHub repository").fill("octocat/Spoon-Knife");
  await page.getByRole("button", { name: "Generate Wiki" }).click();

  const wikiLink = page.getByRole("link", { name: "View wiki" });
  await expect(wikiLink).toBeVisible();
  await wikiLink.click();
  await expect(page).toHaveURL(/\/wiki\?jobId=/);
  await expect(page.getByText("generating...", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chapters" })).toBeVisible();

  const chapterButtons = page.locator("aside button");
  await expect.poll(() => chapterButtons.count()).toBeGreaterThan(1);
  const chapterTitles = await chapterButtons.allTextContents();

  await chapterButtons.nth(1).click();
  await expect(page.locator("article h2")).toHaveText(chapterTitles[1]);
  await expect(page.locator(".diagram svg")).toHaveCount(1);
  const secondMarkdown = await page.locator(".chapter").innerText();
  const secondDiagram = await page.locator(".diagram svg").textContent();

  await chapterButtons.nth(0).click();
  await expect(page.locator("article h2")).toHaveText(chapterTitles[0]);
  await expect(page.locator(".diagram svg")).toHaveCount(1);
  await expect(page.locator(".chapter")).not.toHaveText(secondMarkdown);
  await expect.poll(() => page.locator(".diagram svg").textContent()).not.toBe(secondDiagram);
  await page.screenshot({ path: "screenshots/wiki-chapter.png", fullPage: true });
});
