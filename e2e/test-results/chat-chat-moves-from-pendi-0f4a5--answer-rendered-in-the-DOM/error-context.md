# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chat.spec.js >> chat moves from pending to an answer rendered in the DOM
- Location: chat.spec.js:16:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "completed"
Received: "pending"

Call Log:
- Timeout 120000ms exceeded while waiting on the predicate
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | const REPO = "octocat/Spoon-Knife";
  4  | 
  5  | async function ensureIndexed(request) {
  6  |   const startResponse = await request.post("/api/index", { data: { repo: REPO } });
  7  |   expect(startResponse.status()).toBe(202);
  8  |   const { jobId } = await startResponse.json();
  9  | 
  10 |   await expect.poll(async () => {
  11 |     const response = await request.get(`/api/index/jobs/${jobId}`);
  12 |     return (await response.json()).status;
> 13 |   }, { timeout: 120_000 }).toBe("completed");
     |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  14 | }
  15 | 
  16 | test("chat moves from pending to an answer rendered in the DOM", async ({ page, request }) => {
  17 |   await ensureIndexed(request);
  18 |   await page.goto("/chat");
  19 |   await page.getByLabel("Repository").fill(REPO);
  20 |   await page.getByLabel("Question").fill("What does this repository contain?");
  21 |   await page.getByRole("button", { name: "Ask" }).click();
  22 | 
  23 |   await expect(page.getByText("pending...", { exact: true })).toBeVisible();
  24 |   await expect(page.getByRole("heading", { name: "Answer" })).toBeVisible();
  25 |   await expect(page.locator(".chat-answer-markdown")).not.toBeEmpty();
  26 |   await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  27 |   await expect.poll(() => page.locator("article li").count()).toBeGreaterThan(0);
  28 |   await page.screenshot({ path: "screenshots/chat-completed.png", fullPage: true });
  29 | });
  30 | 
```