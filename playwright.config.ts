import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results/playwright",
  workers: 1,
  use: { channel: "chrome", baseURL: "http://127.0.0.1:5174" },
  webServer: [
    {
      command: "uv run uvicorn accountable.main:app --port 8100",
      url: "http://127.0.0.1:8100/api/health",
      env: { ACCOUNTABLE_DB: "test-results/e2e.db", ACCOUNTABLE_RESET: "1" },
      reuseExistingServer: false,
    },
    {
      command: "npm -w frontend run dev",
      url: "http://127.0.0.1:5174",
      env: { PORT: "5174", ACCOUNTABLE_API: "http://127.0.0.1:8100" },
      reuseExistingServer: false,
    },
  ],
});
