import { describe, expect, it } from "vitest";
import { parsePieceQuery, pieceQueryFilter } from "./pieceSearch";

describe("parsePieceQuery", () => {
  it("understands codes in many forms", () => {
    expect(parsePieceQuery("C-0042").code).toBe("C-0042");
    expect(parsePieceQuery("c42").code).toBe("C-0042");
    expect(parsePieceQuery("42").code).toBe("C-0042");
    expect(parsePieceQuery("c-12345").code).toBe("C-12345");
  });

  it("searches phones by digits", () => {
    expect(parsePieceQuery("686 123 4567")).toEqual({ phoneDigits: "6861234567" });
    expect(parsePieceQuery("4567")).toMatchObject({ code: "C-4567", phoneDigits: "4567" });
  });

  it("searches names and strips unsafe characters", () => {
    expect(parsePieceQuery("Ana López")).toEqual({ name: "Ana López" });
    expect(parsePieceQuery("ana),status.eq.donated")).toEqual({ name: "anastatus.eq.donated" });
    expect(parsePieceQuery("C-")).toEqual({});
    expect(parsePieceQuery("   ")).toEqual({});
  });
});

describe("pieceQueryFilter", () => {
  it("builds an OR filter", () => {
    expect(pieceQueryFilter({ code: "C-0042", phoneDigits: "0042" })).toBe("code.eq.C-0042,phone.like.*0042*");
    expect(pieceQueryFilter({ name: "Ana" })).toBe("name.ilike.*Ana*");
    expect(pieceQueryFilter({})).toBeNull();
  });
});
