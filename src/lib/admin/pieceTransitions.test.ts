import { describe, expect, it } from "vitest";
import { actionUpdate, availableActions } from "./pieceTransitions";

describe("piece actions", () => {
  it("offers the right buttons per status", () => {
    expect(availableActions({ status: "received", delayed: false })).toEqual(["firing", "ready", "delay", "pickedUp"]);
    expect(availableActions({ status: "firing", delayed: true })).toEqual(["ready", "undelay", "pickedUp"]);
    expect(availableActions({ status: "ready", delayed: false })).toEqual(["pickedUp"]);
    expect(availableActions({ status: "picked_up", delayed: false })).toEqual([]);
    expect(availableActions({ status: "donated", delayed: false })).toEqual(["pickedUp"]);
  });

  it("marking ready clears the delay and stamps ready_at", () => {
    expect(actionUpdate("ready", "T")).toEqual({ status: "ready", ready_at: "T", delayed: false });
    expect(actionUpdate("pickedUp", "T")).toEqual({ status: "picked_up", picked_up_at: "T" });
  });
});
