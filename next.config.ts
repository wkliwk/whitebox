import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ISR revalidation handled per-page via revalidate export
  serverExternalPackages: ["octokit", "@octokit/rest", "@upstash/redis"],
};

export default nextConfig;
