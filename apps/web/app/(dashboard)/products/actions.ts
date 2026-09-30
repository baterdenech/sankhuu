"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { uploadImage } from "@/lib/storage";
import { analyzeProductImage, type ProductDraft } from "@/lib/ai/product";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

export type FormState = { error?: string };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const int = (fd: FormData, k: string) => {
  const n = Number(str(fd, k).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
};

function readFields(fd: FormData) {
  const name = str(fd, "name");
  const price = int(fd, "price");
  const stock = int(fd, "stock");
  const category = str(fd, "category");
  if (name.length < 2) return { error: "Барааны нэрээ оруулна уу." } as const;
  if (!Number.isFinite(price) || price <= 0) return { error: "Үнээ төгрөгөөр оруулна уу." } as const;
  if (!Number.isFinite(stock) || stock < 0) return { error: "Үлдэгдэл 0 эсвэл түүнээс их байна." } as const;
  const compareRaw = str(fd, "compareAtPrice");
  const compareAtPrice = compareRaw ? int(fd, "compareAtPrice") : null;
  if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)) {
    return { error: "Хямдралын өмнөх үнэ одоогийн үнээс их байх ёстой." } as const;
  }
  return {
    data: {
      name,
      price,
      compareAtPrice,
      stock,
      description: str(fd, "description") || null,
      category: (PRODUCT_CATEGORIES as readonly string[]).includes(category) ? category : null,
      sku: str(fd, "sku") || null,
    },
  } as const;
}

// Зурагнаас AI-аар нэр, тайлбар, ангилал санал болгоно
export async function suggestFromImage(formData: FormData): Promise<ProductDraft | null> {
  await requireShop();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  try {
    return await analyzeProductImage(Buffer.from(await file.arrayBuffer()), file.type, str(formData, "hint") || undefined);
  } catch (e) {
    console.error("AI product analysis failed", e);
    return null;
  }
}

async function readImage(fd: FormData, shopId: string): Promise<string | null> {
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  return uploadImage(file, `shops/${shopId}`);
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const { shop } = await requireShop();
  const fields = readFields(formData);
  if ("error" in fields) return { error: fields.error };

  let imageUrl: string | null;
  try {
    imageUrl = await readImage(formData, shop.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Зураг хадгалж чадсангүй." };
  }

  await prisma.product.create({
    data: { ...fields.data, shopId: shop.id, images: imageUrl ? [imageUrl] : [] },
  });
  revalidatePath("/products");
  revalidatePath("/dashboard");
  redirect("/products");
}

export async function updateProduct(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { shop } = await requireShop();
  const fields = readFields(formData);
  if ("error" in fields) return { error: fields.error };

  const existing = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!existing) return { error: "Бараа олдсонгүй." };

  let images = existing.images;
  try {
    const url = await readImage(formData, shop.id);
    if (url) images = [url, ...existing.images.slice(1)];
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Зураг хадгалж чадсангүй." };
  }

  await prisma.product.update({ where: { id }, data: { ...fields.data, images } });
  revalidatePath("/products");
  redirect("/products");
}

// Устгахын оронд идэвхгүй болгоно: хуучин захиалгууд барааг заасаар үлдэнэ
export async function archiveProduct(id: string) {
  const { shop } = await requireShop();
  await prisma.product.updateMany({ where: { id, shopId: shop.id }, data: { isActive: false } });
  revalidatePath("/products");
  revalidatePath("/dashboard");
  redirect("/products");
}

export async function adjustStock(id: string, delta: number) {
  const { shop } = await requireShop();
  const d = Math.trunc(delta);
  if (!Number.isFinite(d) || d === 0) return;
  await prisma.$executeRaw`
    UPDATE "Product" SET "stock" = GREATEST(0, "stock" + ${d}), "updatedAt" = now()
    WHERE "id" = ${id} AND "shopId" = ${shop.id}`;
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

// ─── Олноор бүртгэх: зураг бүрийг хадгалаад AI-аар ноорог гаргана, дараа нь нэг дор үүсгэнэ ───
export type BulkDraft = { imageUrl: string; name: string; description: string; category: string; price: number | null };

export async function draftFromImage(formData: FormData): Promise<BulkDraft | { error: string }> {
  const { shop } = await requireShop();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Зураг алга." };
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const [imageUrl, draft] = await Promise.all([
      uploadImage(file, `shops/${shop.id}`),
      analyzeProductImage(bytes, file.type).catch((e) => (console.error("AI bulk analysis failed", e), null)),
    ]);
    return {
      imageUrl,
      name: draft?.name ?? "",
      description: draft?.description ?? "",
      category: draft?.category ?? "",
      price: draft?.suggestedPriceMnt ? Math.round(draft.suggestedPriceMnt / 1000) * 1000 : null,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Зураг хадгалж чадсангүй." };
  }
}

export type BulkRow = { imageUrl: string; name: string; description: string; category: string; price: number; stock: number };

export async function createProducts(rows: BulkRow[]): Promise<{ created?: number; error?: string }> {
  const { shop } = await requireShop();
  if (!Array.isArray(rows) || rows.length === 0) return { error: "Бараа алга." };
  if (rows.length > 50) return { error: "Нэг удаад 50 хүртэл бараа бүртгэнэ." };
  const data = [];
  for (const [i, r] of rows.entries()) {
    const name = String(r.name ?? "").trim();
    const price = Math.trunc(Number(r.price));
    const stock = Math.trunc(Number(r.stock));
    if (name.length < 2) return { error: `${i + 1}-р барааны нэрийг оруулна уу.` };
    if (!Number.isFinite(price) || price <= 0) return { error: `"${name}" барааны үнийг оруулна уу.` };
    if (!Number.isFinite(stock) || stock < 0) return { error: `"${name}" барааны үлдэгдэл буруу байна.` };
    if (typeof r.imageUrl !== "string" || !r.imageUrl) return { error: `"${name}" барааны зураг алга.` };
    data.push({
      shopId: shop.id,
      name,
      price,
      stock,
      description: String(r.description ?? "").trim() || null,
      category: (PRODUCT_CATEGORIES as readonly string[]).includes(r.category) ? r.category : null,
      images: [r.imageUrl],
    });
  }
  await prisma.product.createMany({ data });
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { created: data.length };
}
