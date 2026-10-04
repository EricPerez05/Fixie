import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The scan route reads the knowledge vault from disk at runtime. File
  // tracing can't see fs reads, so ship the notes with the function
  // explicitly or production silently runs with an empty knowledge base.
  outputFileTracingIncludes: {
    "/api/scan": ["./knowledge/items/**/*.md"],
  },
};

export default nextConfig;
