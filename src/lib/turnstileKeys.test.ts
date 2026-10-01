import { describe, expect, it } from "vitest";
import { turnstileSecret, turnstileSiteKey, TURNSTILE_TEST_SECRET, TURNSTILE_TEST_SITE_KEY } from "./turnstileKeys";

describe("turnstile keys", () => {
  it("development always uses the test keys (works on any hostname)", () => {
    const env = { NODE_ENV: "development", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0xREAL", TURNSTILE_SECRET_KEY: "real" };
    expect(turnstileSiteKey(env)).toBe(TURNSTILE_TEST_SITE_KEY);
    expect(turnstileSecret(env)).toBe(TURNSTILE_TEST_SECRET);
  });
  it("production uses the real keys", () => {
    const env = { NODE_ENV: "production", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0xREAL", TURNSTILE_SECRET_KEY: "real" };
    expect(turnstileSiteKey(env)).toBe("0xREAL");
    expect(turnstileSecret(env)).toBe("real");
  });
  it("production without a secret fails closed", () => {
    expect(turnstileSecret({ NODE_ENV: "production" })).toBeNull();
  });
});
