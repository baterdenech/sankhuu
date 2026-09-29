import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migration-ыг pooler-оор биш, шууд холболтоор (DIRECT_URL) хийнэ.
// Апп ажиллах үед DATABASE_URL (Supabase transaction pooler) ашиглагдана: src/index.ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/sankhuu",
  },
});
