import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";
import { assertLiveDbTestsUnlocked } from "./test-support/liveDb";

// The database is LIVE: refuse to run unless unlocked on the command line.
const commandLineEnv = { ...process.env };
loadEnvConfig(process.cwd());
assertLiveDbTestsUnlocked(commandLineEnv, process.env);

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/setup.ts",
  globalTeardown: "./e2e/teardown.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Cloudflare's always-pass Turnstile test keys, so the widget never blocks automation.
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      // Never send real emails from tests: empty key → emails are logged to the console.
      RESEND_API_KEY: "",
      CRON_SECRET: "e2e-cron-secret", // only used to check the route rejects bad secrets
      // Admin pages accept the e2e_admin=1 cookie as a signed-in admin (dev server only).
      E2E_ADMIN_BYPASS: "1",
    },
    timeout: 120_000,
  },
});
