export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Шинэ publishable key эсвэл хуучин anon key: аль нэг нь байхад хангалттай
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL болон NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (эсвэл NEXT_PUBLIC_SUPABASE_ANON_KEY) тохируулаагүй байна (.env.example-г үзнэ үү)",
    );
  }
  return { url, key };
}
