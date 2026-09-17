import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./data/**/*', './cache/**/*'],
  },
};

export default nextConfig;
