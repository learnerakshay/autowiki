import { expect, test } from "@playwright/test";

const REPO = "octocat/Spoon-Knife";

async function ensureIndexed(request) {
  const startResponse = await request.post("/api/index", { data: { repo: REPO } });
  expect(startResponse.status()).toBe(202);
  const { jobId } = await startResponse.json();

  await expect.poll(async () => {
    const response = await request.get(`/api/index/jobs/${jobId}`);
    return (await response.json()).status;
  }, { timeout: 120_000 }).toBe("completed");
}

test("chat moves from pending to an answer rendered in the DOM", async ({ page, request }) => {
  await ensureIndexed(request);
  await page.goto("/chat");
  await page.getByLabel("Repository").fill(REPO);
  await page.getByLabel("Question").fill("What does this repository contain?");
  await page.getByRole("button", { name: "Ask" }).click();

  await expect(page.getByText("pending...", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Answer" })).toBeVisible();
  await expect(page.locator(".chat-answer-markdown")).not.toBeEmpty();
  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  await expect.poll(() => page.locator("article li").count()).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/captures/chat-completed.png", fullPage: true });
});
