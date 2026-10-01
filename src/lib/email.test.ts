import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { consoleSender, emailSender, resendSender } from "./email";

describe("emailSender", () => {
  it("logs to the console when RESEND_API_KEY is missing", async () => {
    const saved = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      const sender = emailSender();
      expect(sender).toBe(consoleSender);
      const res = await sender({ to: "a@example.com", subject: "Hola", react: createElement("p", null, "Texto") });
      expect(res.id).toMatch(/^console-/);
      expect(info.mock.calls[0][0]).toContain("Subject: Hola");
      expect(info.mock.calls[0][0]).toContain("Texto");
    } finally {
      process.env.RESEND_API_KEY = saved;
      warn.mockRestore();
      info.mockRestore();
    }
  });

  it("uses Resend when the key is set", () => {
    const saved = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_test";
    try {
      expect(emailSender()).toBe(resendSender);
    } finally {
      process.env.RESEND_API_KEY = saved;
    }
  });
});
