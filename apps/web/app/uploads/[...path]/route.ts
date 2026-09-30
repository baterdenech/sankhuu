import fs from "node:fs/promises";
import path from "node:path";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

// Зөвхөн локал хөгжүүлэлтэд: .uploads/ доторх зургийг үйлчилнэ. Production-д зураг Supabase Storage-оос ирнэ.
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const file = path.resolve(LOCAL_UPLOAD_DIR, ...parts);
  if (!file.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return new Response("Not found", { status: 404 });
  const type = TYPES[path.extname(file).slice(1)];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(file);
    return new Response(new Uint8Array(data), {
      headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
