import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results/",
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm -C ../server dev",
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm -C ../web dev",
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
