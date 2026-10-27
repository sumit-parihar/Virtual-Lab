import { defineConfig } from "@playwright/test";

// End-to-end checks against a running app (backend on :8000 with the seed data, frontend on :5173).
//   npx playwright install chromium     (once)
//   npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: { baseURL: process.env.E2E_BASE_URL || "http://localhost:5173", headless: true },
});
