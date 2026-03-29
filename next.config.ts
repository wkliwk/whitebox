import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lucide-react@1.x uses ESM barrel exports that create circular module
  // initialization order in webpack's SSR bundle, causing TDZ errors on
  // Vercel (Node 22). transpilePackages forces webpack to compile it to
  // CJS, breaking the circular init. (#82)
  transpilePackages: ["lucide-react"],
  // Disable barrel-import rewriting — was already causing TDZ before
  // transpilePackages fix, keep off to avoid double-processing.
  experimental: {
    optimizePackageImports: [],
  },
  // Don't let ESLint config issues fail the Vercel build. (#82)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
