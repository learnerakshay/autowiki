# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wiki.spec.js >> wiki replaces chapter content and keeps exactly one Mermaid SVG
- Location: wiki.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Chapters' })
Expected: visible
Timeout: 120000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Chapters' }) with timeout 120000ms
  - waiting for getByRole('heading', { name: 'Chapters' })

```

```yaml
- banner:
  - link "AutoWiki home":
    - /url: /
    - text: AutoWiki
  - navigation "Main navigation":
    - link "Workspace":
      - /url: /workspace
    - link "Chat":
      - /url: /chat
    - link "Wiki":
      - /url: /wiki
    - link "Architecture":
      - /url: /architecture
- main:
  - region "Generating your technical wiki":
    - link "Back to Workspace":
      - /url: /workspace
    - status: generating...
    - heading "Generating your technical wiki" [level=1]
    - paragraph: AutoWiki is analyzing the repository, organizing its architecture, and writing the generated document. The activity below comes from real worker boundaries rather than a simulated percentage.
    - region "Wiki generation activity":
      - heading "Generation activity" [level=2]
      - paragraph: Latest operation reported by the generation worker.
      - code: octocat/Spoon-Knife
      - paragraph: Reading repository files
      - text: Live worker activity. No percentage or completion estimate is available.
      - list "Generation stages":
        - listitem: Queued
        - listitem: Repository
        - listitem: Outline
        - listitem: Chapters
        - listitem: Save
    - paragraph: When generation finishes, this route becomes the chaptered Wiki reader with its source references and diagrams intact.
    - group: Job details
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("wiki replaces chapter content and keeps exactly one Mermaid SVG", async ({ page }) => {
  4  |   await page.goto("/workspace");
  5  |   await page.screenshot({ path: "screenshots/home.png", fullPage: true });
  6  |   await page.getByLabel("GitHub repository").fill("octocat/Spoon-Knife");
  7  |   await page.getByRole("button", { name: "Generate Wiki" }).click();
  8  | 
  9  |   const wikiLink = page.getByRole("link", { name: "View wiki" });
  10 |   await expect(wikiLink).toBeVisible();
  11 |   await wikiLink.click();
  12 |   await expect(page).toHaveURL(/\/wiki\?jobId=/);
  13 |   await expect(page.getByText("generating...", { exact: true })).toBeVisible();
> 14 |   await expect(page.getByRole("heading", { name: "Chapters" })).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  15 | 
  16 |   const chapterButtons = page.locator("aside button");
  17 |   await expect.poll(() => chapterButtons.count()).toBeGreaterThan(1);
  18 |   const chapterTitles = await chapterButtons.allTextContents();
  19 | 
  20 |   await chapterButtons.nth(1).click();
  21 |   await expect(page.locator("article h2")).toHaveText(chapterTitles[1]);
  22 |   await expect(page.locator(".diagram svg")).toHaveCount(1);
  23 |   const secondMarkdown = await page.locator(".chapter").innerText();
  24 |   const secondDiagram = await page.locator(".diagram svg").textContent();
  25 | 
  26 |   await chapterButtons.nth(0).click();
  27 |   await expect(page.locator("article h2")).toHaveText(chapterTitles[0]);
  28 |   await expect(page.locator(".diagram svg")).toHaveCount(1);
  29 |   await expect(page.locator(".chapter")).not.toHaveText(secondMarkdown);
  30 |   await expect.poll(() => page.locator(".diagram svg").textContent()).not.toBe(secondDiagram);
  31 |   await page.screenshot({ path: "screenshots/wiki-chapter.png", fullPage: true });
  32 | });
  33 | 
```