import { defineConfig } from "@playwright/test";

/** The signed-in browser state that auth.setup.ts saves for the other specs. */
export const SIGNED_IN = "test-results/auth/test-user.json";

/** The local test sign-in's token, for the specs' own calls with page.request. */
const TEST_USER_TOKEN = { Authorization: "Bearer local-test-user" };

export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results/playwright",
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { channel: "chrome", baseURL: "http://127.0.0.1:5174" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chrome",
      dependencies: ["setup"],
      use: { storageState: SIGNED_IN, extraHTTPHeaders: TEST_USER_TOKEN },
    },
  ],
  webServer: [
    {
      command: "uv run uvicorn accountable.main:app --port 8100",
      url: "http://127.0.0.1:8100/api/health",
      env: { ACCOUNTABLE_DB: "test-results/e2e.db", ACCOUNTABLE_RESET: "1", DATABASE_URL: "" },
      reuseExistingServer: false,
    },
    {
      command: "npm -w frontend run dev -- --host 127.0.0.1",
      url: "http://127.0.0.1:5174",
      env: { PORT: "5174", ACCOUNTABLE_API: "http://127.0.0.1:8100" },
      reuseExistingServer: false,
    },
  ],
});
