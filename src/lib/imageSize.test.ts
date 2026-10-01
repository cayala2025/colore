import { describe, expect, it } from "vitest";
import { fitWithin } from "./imageSize";

describe("fitWithin", () => {
  it("scales landscape and portrait by the long edge", () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 });
  });
  it("never upscales", () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});
