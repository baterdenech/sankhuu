import { prisma } from "@sankhuu/db";

export const dynamic = "force-dynamic";

// Оношилгоо: тохиргоо, DB холболт, схемийн байдлыг нууц мэдээлэлгүйгээр харуулна
export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const env = {
    DATABASE_URL: describeUrl(dbUrl),
    SUPABASE_URL: describeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL),
    SUPABASE_KEY: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.SUPABASE_ANON_KEY,
    ),
    SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    node: process.version,
    vercelRegion: process.env.VERCEL_REGION ?? null,
  };

  let db: unknown;
  try {
    const started = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const columns = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND (
        (table_name = 'User' AND column_name IN ('username', 'phone')) OR
        (table_name = 'Product' AND column_name = 'category')
      ) ORDER BY 1, 2`;
    const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations" ORDER BY started_at`;
    const counts = await prisma.$queryRaw<{ users: bigint; shops: bigint; products: bigint }[]>`
      SELECT (SELECT count(*) FROM "User") users, (SELECT count(*) FROM "Shop") shops, (SELECT count(*) FROM "Product") products`;
    db = {
      ok: true,
      ms: Date.now() - started,
      columns: columns.map((c) => `${c.table_name}.${c.column_name}`),
      migrations: migrations.map((m) => m.migration_name),
      counts: Object.fromEntries(Object.entries(counts[0] ?? {}).map(([k, v]) => [k, Number(v)])),
    };
  } catch (e) {
    db = { ok: false, error: sanitize(e, dbUrl) };
  }

  let auth: unknown;
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const res = await fetch(`${base}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
      cache: "no-store",
    });
    const j = (await res.json()) as { external?: Record<string, boolean>; mailer_autoconfirm?: boolean; phone_autoconfirm?: boolean; disable_signup?: boolean };
    auth = res.ok
      ? { ok: true, emailEnabled: j.external?.email, phoneEnabled: j.external?.phone, confirmEmailOff: j.mailer_autoconfirm, signupDisabled: j.disable_signup }
      : { ok: false, status: res.status, body: j };
  } catch (e) {
    auth = { ok: false, error: sanitize(e) };
  }

  return Response.json({ env, db, auth }, { headers: { "cache-control": "no-store" } });
}

// Холболтын мөрийг нууц үггүйгээр тайлбарлана
function describeUrl(url: string | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return { host: u.hostname, port: u.port || null, user: u.username ? u.username.replace(/(.{3}).+/, "$1…") : null, params: u.search || null, passwordLooksLikePlaceholder: /\[|YOUR/i.test(u.password) };
  } catch {
    return { invalid: true, startsWith: url.slice(0, 12) + "…" };
  }
}

function sanitize(e: unknown, secretUrl?: string) {
  const err = e as { message?: string; code?: string; name?: string };
  let msg = String(err?.message ?? e);
  if (secretUrl) {
    try {
      const pw = new URL(secretUrl).password;
      if (pw) msg = msg.split(pw).join("•••");
    } catch {}
  }
  return { name: err?.name, code: err?.code, message: msg.slice(0, 600) };
}
