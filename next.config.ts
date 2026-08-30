import type { NextConfig } from "next";

// GITHUB_PAGES=true only during the static-export build (see package.json's
// "build:pages" script) — keeps local `next dev` serving from the plain
// root instead of needing every link visited at /habitat-pulse-hero/.
const isGithubPages = process.env.GITHUB_PAGES === "true";

const basePath = isGithubPages ? "/habitat-pulse-hero" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // `env` (not just process.env) is required to expose this to client
  // components: `images.unoptimized: true` makes next/image render a plain
  // <img>, which — unlike its normal optimized-proxy path — does NOT
  // auto-prefix local /public asset URLs with basePath. Local image
  // references (e.g. the logo) must prepend this themselves.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    // GitHub Pages can't run Next's image-optimization server; every image
    // here is already a direct, appropriately-sized remote URL (Unsplash's
    // own ?w=/?q= params), so unoptimized <img> tags are the right call
    // for a static export, not a workaround.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
