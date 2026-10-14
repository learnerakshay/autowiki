import { defineConfig } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export default defineConfig({
  testDir: ".",
  snapshotPathTemplate: '{testDir}/screenshots/{arg}{ext}',
  testMatch: /.*\.spec\.js/,
  timeout: 180_000,
  expect: { timeout: 120_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    browserName: "chromium",
    deviceScaleFactor: 1,
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
});
