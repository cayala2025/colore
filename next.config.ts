import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright runs its own dev server in a separate build folder, so it works while `npm run dev` is running.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Dev only: let phones on the home Wi-Fi open the dev server through the Mac's "Network" address
  // (e.g. http://192.168.1.140:3000). Without this, Next blocks its dev scripts and buttons do nothing.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
};

export default nextConfig;
