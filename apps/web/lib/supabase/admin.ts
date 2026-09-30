import { createClient } from "@supabase/supabase-js";

// Supabase Auth-ын админ клиент (secret key): админ жолоочийн бүртгэл үүсгэхэд хэрэглэнэ.
// SUPABASE_SECRET_KEY байхгүй бол null: тэр үед жолооч өөрөө бүртгүүлж, админ түүнийг жолооч болгоно.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
