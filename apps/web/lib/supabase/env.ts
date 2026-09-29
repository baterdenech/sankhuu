// Supabase-ийг зөвхөн серверээс (proxy, Server Component, Server Action) ашигладаг тул
// Vercel-ийн Supabase integration-ы NEXT_PUBLIC_ угтваргүй нэрсийг ч хүлээн авна.
export function supabaseEnv() {
  const env = process.env;
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const key =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase тохируулаагүй байна: NEXT_PUBLIC_SUPABASE_URL болон NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY хэрэгтэй (.env.example-г үзнэ үү)",
    );
  }
  return { url, key };
}
