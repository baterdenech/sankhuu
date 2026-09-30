import type { Prisma } from "@sankhuu/db";

// ─── Барааны хувилбар: формын мөр, захиалгын мөр, үлдэгдэл хасах/буцаах (сагс ба гар захиалга хоёуланд) ───

export type VariantInput = {
  id?: string;
  name: string;
  stock: number;
  price: number | null;
};
export type VariantLite = {
  id: string;
  name: string;
  price: number | null;
  stock: number;
};

export const MAX_VARIANTS = 30;

// Формын hidden JSON → шалгасан жагсаалт. Хоосон массив = хувилбаргүй бараа.
export function parseVariants(
  raw: string,
): { variants: VariantInput[] } | { error: string } {
  if (!raw) return { variants: [] };
  let list: unknown;
  try {
    list = JSON.parse(raw);
  } catch {
    return { error: "Хувилбарын мэдээлэл буруу байна." };
  }
  if (!Array.isArray(list))
    return { error: "Хувилбарын мэдээлэл буруу байна." };
  if (list.length > MAX_VARIANTS)
    return { error: `Нэг бараанд ${MAX_VARIANTS} хүртэл хувилбар оруулна.` };
  const out: VariantInput[] = [];
  const names = new Set<string>();
  for (const v of list as Record<string, unknown>[]) {
    const name = String(v.name ?? "").trim();
    const stock = Math.trunc(Number(v.stock));
    const priceRaw =
      v.price === null || v.price === undefined || v.price === ""
        ? null
        : Math.trunc(Number(v.price));
    if (!name) continue; // нэргүй мөрийг алгасна (худалдагч хоосон мөр үлдээсэн)
    if (name.length > 40)
      return { error: "Хувилбарын нэр 40 тэмдэгтээс богино байна." };
    if (names.has(name.toLowerCase()))
      return { error: `"${name}" хувилбар давхардаж байна.` };
    names.add(name.toLowerCase());
    if (!Number.isFinite(stock) || stock < 0)
      return {
        error: `"${name}" хувилбарын үлдэгдэл 0 эсвэл түүнээс их байна.`,
      };
    if (priceRaw !== null && (!Number.isFinite(priceRaw) || priceRaw <= 0))
      return { error: `"${name}" хувилбарын үнэ буруу байна.` };
    out.push({
      id: typeof v.id === "string" && v.id ? v.id : undefined,
      name,
      stock,
      price: priceRaw,
    });
  }
  return { variants: out };
}

export const sumStock = (vs: { stock: number }[]) =>
  vs.reduce((s, v) => s + v.stock, 0);

// Барааны хувилбаруудыг формын жагсаалттай тааруулна: хасагдсаныг устгаж, байгааг шинэчилж, шинийг нэмнэ; барааны stock = нийлбэр
export async function syncVariants(
  tx: Prisma.TransactionClient,
  productId: string,
  variants: VariantInput[],
) {
  const existing = await tx.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  const keep = new Set(
    variants.map((v) => v.id).filter((x): x is string => Boolean(x)),
  );
  const toDelete = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
  if (toDelete.length)
    await tx.productVariant.deleteMany({
      where: { id: { in: toDelete }, productId },
    });
  for (const [i, v] of variants.entries()) {
    const data = { name: v.name, stock: v.stock, price: v.price, sortOrder: i };
    if (v.id && existing.some((e) => e.id === v.id))
      await tx.productVariant.update({ where: { id: v.id }, data });
    else await tx.productVariant.create({ data: { ...data, productId } });
  }
  if (variants.length)
    await tx.product.update({
      where: { id: productId },
      data: { stock: sumStock(variants) },
    });
}

// Захиалгын мөр: бараа + (заавал биш) хувилбар → нэр, үнэ. Хувилбартай бараанд хувилбар заавал.
export type OrderLineInput = {
  productId: string;
  variantId?: string | null;
  qty: number;
};
export type ResolvedLine = {
  productId: string;
  variantId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
};

export function resolveLine(
  p: { id: string; name: string; price: number; variants: VariantLite[] },
  l: OrderLineInput,
): ResolvedLine | { error: string } {
  if (p.variants.length === 0)
    return {
      productId: p.id,
      variantId: null,
      name: p.name,
      unitPrice: p.price,
      quantity: l.qty,
    };
  const v = l.variantId
    ? p.variants.find((x) => x.id === l.variantId)
    : undefined;
  if (!v)
    return {
      error: `"${p.name}" барааны хувилбараа (размер, өнгө) сонгоно уу.`,
    };
  return {
    productId: p.id,
    variantId: v.id,
    name: `${p.name} · ${v.name}`,
    unitPrice: v.price ?? p.price,
    quantity: l.qty,
  };
}

export class StockError extends Error {
  constructor(public productName: string) {
    super("stock");
  }
}

// Үлдэгдэл хасна: хувилбартай бол хувилбараас (шалгалттай) + бараанаас (нийлбэр), үгүй бол бараанаас шалгалттай
export async function takeStock(
  tx: Prisma.TransactionClient,
  it: ResolvedLine,
) {
  if (it.variantId) {
    const r = await tx.productVariant.updateMany({
      where: { id: it.variantId, stock: { gte: it.quantity } },
      data: { stock: { decrement: it.quantity } },
    });
    if (r.count === 0) throw new StockError(it.name);
    await tx.product.updateMany({
      where: { id: it.productId },
      data: { stock: { decrement: it.quantity } },
    });
  } else {
    const r = await tx.product.updateMany({
      where: { id: it.productId, stock: { gte: it.quantity } },
      data: { stock: { decrement: it.quantity } },
    });
    if (r.count === 0) throw new StockError(it.name);
  }
}

// Цуцлахад үлдэгдлийг буцаана (хувилбар устсан бол зөвхөн бараанд)
export async function returnStock(
  tx: Prisma.TransactionClient,
  it: { productId: string | null; variantId: string | null; quantity: number },
) {
  if (it.variantId)
    await tx.productVariant.updateMany({
      where: { id: it.variantId },
      data: { stock: { increment: it.quantity } },
    });
  if (it.productId)
    await tx.product.updateMany({
      where: { id: it.productId },
      data: { stock: { increment: it.quantity } },
    });
}

// Сагсны мөрийн түлхүүр (нэг бараа олон хувилбараар сагсанд байж болно)
export const lineKey = (productId: string, variantId?: string | null) =>
  `${productId}:${variantId ?? ""}`;
