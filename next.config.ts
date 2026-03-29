import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ISR revalidation handled per-page via revalidate export
  // Note: removed serverExternalPackages — was causing TDZ errors on Vercel
  // octokit is now dynamically imported where needed
};

export default nextConfig;
