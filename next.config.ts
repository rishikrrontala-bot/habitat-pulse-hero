import type { NextConfig } from "next";

// GITHUB_PAGES=true only during the static-export build (see package.json's
// "build:pages" script) — keeps local `next dev` serving from the plain
// root instead of needing every link visited at /habitat-pulse-hero/.
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? "/habitat-pulse-hero" : "",
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
