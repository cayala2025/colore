import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows up to the limit per window, per key", () => {
    const allow = createRateLimiter(2, 1000);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(false);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1000)).toBe(true);
  });
});
