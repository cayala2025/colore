import { describe, expect, it } from "vitest";
import { waLink } from "./waLink";

describe("waLink", () => {
  it("returns # when the number is empty or missing", () => {
    expect(waLink("", "hola")).toBe("#");
    expect(waLink(undefined, "hola")).toBe("#");
    expect(waLink(null, "hola")).toBe("#");
  });

  it("builds a wa.me link with encoded text", () => {
    expect(waLink("5216860000000", "Hola, quiero reservar en Colore para un grupo de ___ personas")).toBe(
      "https://wa.me/5216860000000?text=Hola%2C%20quiero%20reservar%20en%20Colore%20para%20un%20grupo%20de%20___%20personas",
    );
  });

  it("strips non-digits (e.g. E.164 plus sign)", () => {
    expect(waLink("+52 686 123 4567", "x")).toBe("https://wa.me/526861234567?text=x");
  });
});
