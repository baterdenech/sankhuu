import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sankhuu/db"],
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
};

export default nextConfig;
