import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // The SQLite file is opened via fs at runtime (not statically imported),
  // so Next's automatic file tracing may not pick it up for the deployed
  // serverless function bundle — include it explicitly.
  outputFileTracingIncludes: {
    "/**": ["./db/**"],
  },
};

export default nextConfig;
