export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL болон NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY тохируулаагүй байна (.env.example-г үзнэ үү)",
    );
  }
  return { url, key };
}
