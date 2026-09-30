import { prisma, type Prisma } from "@sankhuu/db";

export { ALL_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, DELIVERY_FROM, DELIVERY_PROMISE, arrivalLabel, categoryStyle } from "./catalog-meta";

// Идэвхтэй дэлгүүрийн, нийтэд харагдах бараа
export const publicProductWhere: Prisma.ProductWhereInput = { isActive: true, shop: { isActive: true } };

// Бараа бүрийн зарагдсан тоо (цуцлагдаагүй захиалгаар)
export async function soldCounts(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, order: { status: { notIn: ["CANCELLED", "RETURNED"] } } },
    _sum: { quantity: true },
  });
  return new Map(rows.map((r) => [r.productId!, r._sum.quantity ?? 0]));
}

export async function categoryCounts() {
  const rows = await prisma.product.groupBy({
    by: ["category"],
    where: { ...publicProductWhere, stock: { gt: 0 }, category: { not: null } },
    _count: true,
  });
  return new Map(rows.map((r) => [r.category!, r._count]));
}
