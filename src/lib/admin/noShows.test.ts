import { describe, expect, it } from "vitest";
import { noShowCount } from "./noShows";

describe("noShowCount", () => {
  const history = [
    { id: "1", phone: "+526860000001", status: "no_show" },
    { id: "2", phone: "+526860000001", status: "no_show" },
    { id: "3", phone: "+526860000001", status: "attended" },
    { id: "4", phone: "+526860000002", status: "no_show" },
  ];
  it("counts other no-shows for the same phone", () => {
    expect(noShowCount(history, { id: "9", phone: "+526860000001" })).toBe(2);
    expect(noShowCount(history, { id: "4", phone: "+526860000002" })).toBe(0);
    expect(noShowCount(history, { id: "9", phone: "+526860000003" })).toBe(0);
  });
});
