import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable optimizePackageImports — the barrel-import rewriting for
  // lucide-react creates circular ESM module deps in the webpack bundle,
  // causing TDZ on Node 22 (Vercel runtime).
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
