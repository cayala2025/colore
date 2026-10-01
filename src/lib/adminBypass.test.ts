import { describe, expect, it } from "vitest";
import { adminBypassEnabled } from "./adminBypass";

describe("adminBypassEnabled", () => {
  it("is never enabled in production, even with flag and cookie", () => {
    expect(adminBypassEnabled("1", { NODE_ENV: "production", E2E_ADMIN_BYPASS: "1" })).toBe(false);
  });
  it("requires the explicit flag and the cookie outside production", () => {
    expect(adminBypassEnabled("1", { NODE_ENV: "development" })).toBe(false);
    expect(adminBypassEnabled("1", { NODE_ENV: "development", E2E_ADMIN_BYPASS: "true" })).toBe(false);
    expect(adminBypassEnabled(undefined, { NODE_ENV: "development", E2E_ADMIN_BYPASS: "1" })).toBe(false);
    expect(adminBypassEnabled("1", { NODE_ENV: "development", E2E_ADMIN_BYPASS: "1" })).toBe(true);
  });
});
