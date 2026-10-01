import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "./cronAuth";

describe("isAuthorizedCron", () => {
  it("accepts the exact bearer token", () => {
    expect(isAuthorizedCron("Bearer s3cret", "s3cret")).toBe(true);
  });
  it("rejects missing, wrong or partial tokens", () => {
    expect(isAuthorizedCron(null, "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer nope", "s3cret")).toBe(false);
    expect(isAuthorizedCron("s3cret", "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer s3cret2", "s3cret")).toBe(false);
  });
  it("fails closed when the secret is not configured", () => {
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false);
  });
});
