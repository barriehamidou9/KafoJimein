import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to serve JS chunks/HMR to devices on the local
  // network (e.g. testing from a phone via this machine's LAN IP), which
  // Next.js otherwise blocks by default for anything other than localhost.
  allowedDevOrigins: ["192.168.10.219"],
};

export default nextConfig;
