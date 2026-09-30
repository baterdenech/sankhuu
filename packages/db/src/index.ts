import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

export * from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Supabase-ийн pooler (`*.pooler.supabase.com`) өөрийн CA-аар гарын үсэг зурсан сертификат хэрэглэдэг тул
// node-pg-ийн анхдагч бүрэн шалгалт ("self-signed certificate in certificate chain") бүтэлгүйтдэг.
// SUPABASE_CA_CERT (PEM) өгсөн бол түүгээр бүрэн шалгана; өгөөгүй бол шифрлэлттэй хэвээр ч CA шалгахгүй холбогдоно.
export function pgSslConfig(connectionString: string | undefined) {
  if (!connectionString) return undefined;
  let host = "";
  try {
    host = new URL(connectionString).hostname;
  } catch {
    return undefined;
  }
  if (!/\.supabase\.(com|co)$/.test(host)) return undefined;
  const ca = process.env.SUPABASE_CA_CERT;
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false };
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString, ssl: pgSslConfig(connectionString) });
  return new PrismaClient({ adapter });
}

// Dev горимд hot-reload бүрт шинэ холболт нээхээс сэргийлнэ
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
