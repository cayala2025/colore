import { createElement } from "react";
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createNotifier } from "@/lib/notify";
import { admin, book, cancelTestBookings, testDate } from "./helpers";

afterAll(cancelTestBookings);

const react = createElement("p", null, "hola");

async function newBooking(offset: number) {
  const { data, error } = await book({ date: await testDate(offset), start: "11:00", party: 1 });
  if (error) throw error;
  return data[0].id as string;
}

describe("notify", () => {
  it("logs first, sends once, and skips the second time", async () => {
    const bookingId = await newBooking(33);
    const send = vi.fn(async () => {
      // The log row exists before the email goes out.
      const { data } = await admin.from("notifications_log").select("status").eq("booking_id", bookingId).single();
      expect(data?.status).toBe("pending");
      return { id: "msg_1" };
    });
    const notify = createNotifier({ db: admin, send });
    const input = { target: { bookingId }, template: "test_template", to: "zz-test@example.com", subject: "x", react };

    expect(await notify(input)).toBe("sent");
    expect(await notify(input)).toBe("skipped");
    expect(send).toHaveBeenCalledTimes(1);

    const { data } = await admin.from("notifications_log").select("status, provider_message_id, sent_at").eq("booking_id", bookingId);
    expect(data).toHaveLength(1);
    expect(data![0]).toMatchObject({ status: "sent", provider_message_id: "msg_1" });
  });

  it("two parallel notifies for the same target+template send once", async () => {
    const bookingId = await newBooking(34);
    const send = vi.fn(async () => ({ id: "msg" }));
    const notify = createNotifier({ db: admin, send });
    const input = { target: { bookingId }, template: "test_parallel", to: "zz-test@example.com", subject: "x", react };
    const outcomes = await Promise.all([notify(input), notify(input), notify(input)]);
    expect(outcomes.filter((o) => o === "sent")).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("a failed send is retried later, up to 3 attempts", async () => {
    const bookingId = await newBooking(35);
    const failing = vi.fn(async () => {
      throw new Error("boom");
    });
    const input = { target: { bookingId }, template: "test_retry", to: "zz-test@example.com", subject: "x", react };
    const notifyFail = createNotifier({ db: admin, send: failing });
    expect(await notifyFail(input)).toBe("failed");
    expect(await notifyFail(input)).toBe("failed");
    expect(await notifyFail(input)).toBe("failed");
    expect(await notifyFail(input)).toBe("skipped"); // max attempts reached
    expect(failing).toHaveBeenCalledTimes(3);

    const { data } = await admin.from("notifications_log").select("status, attempts, error").eq("booking_id", bookingId).single();
    expect(data).toMatchObject({ status: "failed", attempts: 3 });
    expect(data?.error).toContain("boom");
  });

  it("a failed send succeeds on retry and then never sends again", async () => {
    const bookingId = await newBooking(36);
    const input = { target: { bookingId }, template: "test_recover", to: "zz-test@example.com", subject: "x", react };
    await createNotifier({ db: admin, send: async () => Promise.reject(new Error("down")) })(input);
    const ok = vi.fn(async () => ({ id: "m" }));
    const notify = createNotifier({ db: admin, send: ok });
    expect(await notify(input)).toBe("sent");
    expect(await notify(input)).toBe("skipped");
    expect(ok).toHaveBeenCalledTimes(1);
  });
});
