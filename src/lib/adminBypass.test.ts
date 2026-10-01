import { describe, expect, it } from "vitest";
import { adminBypassEnabled } from "./adminBypass";

describe("adminBypassEnabled", () => {
  it("is never enabled in production, even with the flag", () => {
    expect(adminBypassEnabled({ NODE_ENV: "production", E2E_ADMIN_BYPASS: "1" })).toBe(false);
  });
  it("requires the explicit flag outside production", () => {
    expect(adminBypassEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(adminBypassEnabled({ NODE_ENV: "development", E2E_ADMIN_BYPASS: "true" })).toBe(false);
    expect(adminBypassEnabled({ NODE_ENV: "development", E2E_ADMIN_BYPASS: "1" })).toBe(true);
  });
});
