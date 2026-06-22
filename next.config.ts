import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a stray lockfile elsewhere on the
  // machine can't be inferred as the root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
