import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const BUCKET = "product-images";
// Локал хөгжүүлэлтийн зургууд (git-д ордоггүй)
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".uploads");
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Зургийг хадгалаад нийтэд нээлттэй URL буцаана.
// Production: Supabase Storage (secret key-тэй). Локал хөгжүүлэлт: apps/web/public/uploads.
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!IMAGE_TYPES.has(file.type)) throw new Error("Зөвхөн JPG, PNG, WebP зураг оруулна.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Зураг 5MB-аас хэтэрч болохгүй.");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `${folder}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const supabase = storageClient();
  if (!supabase) {
    if (process.env.VERCEL) throw new Error("SUPABASE_SECRET_KEY тохируулаагүй тул зураг хадгалах боломжгүй.");
    const dest = path.join(LOCAL_UPLOAD_DIR, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, bytes);
    return `/uploads/${key}`; // app/uploads/[...path]/route.ts үйлчилнэ
  }

  await ensureBucket(supabase);
  const { error } = await supabase.storage.from(BUCKET).upload(key, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Зураг хадгалж чадсангүй: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

function storageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

let bucketReady = false;
async function ensureBucket(supabase: NonNullable<ReturnType<typeof storageClient>>) {
  if (bucketReady) return;
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_BYTES,
      allowedMimeTypes: [...IMAGE_TYPES],
    });
    // Зэрэг хоёр хүсэлт ирэхэд нэг нь "already exists" авч болно
    if (error && !/exist/i.test(error.message)) throw new Error(`Bucket үүсгэж чадсангүй: ${error.message}`);
  }
  bucketReady = true;
}
