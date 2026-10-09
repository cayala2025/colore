import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { admin } from "./helpers";

const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

// 1×1 white JPEG.
const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  "base64",
);

describe("pieces bucket", () => {
  it("is private", async () => {
    const { data } = await admin.storage.getBucket("pieces");
    expect(data?.public).toBe(false);
  });

  it("anon cannot upload or list", async () => {
    const up = await anon.storage.from("pieces").upload(`test/TEST-anon-${Date.now()}.jpg`, JPEG, { contentType: "image/jpeg" });
    expect(up.error).not.toBeNull();
    const list = await anon.storage.from("pieces").list("test");
    expect(list.data ?? []).toEqual([]);
  });

  it("service role can upload and create a signed URL", async () => {
    const path = `test/TEST-${Date.now()}.jpg`;
    const up = await admin.storage.from("pieces").upload(path, JPEG, { contentType: "image/jpeg" });
    expect(up.error).toBeNull();
    const signed = await admin.storage.from("pieces").createSignedUrl(path, 60);
    expect(signed.data?.signedUrl).toContain("token=");
    const res = await fetch(signed.data!.signedUrl);
    expect(res.status).toBe(200);
    // Delete exactly what this test uploaded.
    expect((await admin.storage.from("pieces").remove([path])).error).toBeNull();
  });
});
