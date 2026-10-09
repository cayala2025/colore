// Integration tests against Supabase. The database is LIVE: these only run when unlocked on the
// command line (ALLOW_LIVE_DB_TESTS=yes npm run test:db) and delete exactly the rows they create.
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { assertLiveDbTestsUnlocked } from "./test-support/liveDb";

const fileEnv = loadEnv("development", process.cwd(), "");
assertLiveDbTestsUnlocked(process.env, fileEnv);

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/db/**/*.test.ts"],
    environment: "node",
    env: fileEnv,
    globalSetup: ["./tests/db/globalSetup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
