import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sankhuu/db"],
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  // Барааны зураг Server Action-аар ирдэг (клиент дээр 1280px болгож багасгасан)
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
};

export default nextConfig;
