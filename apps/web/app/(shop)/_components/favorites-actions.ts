"use server";

import { prisma } from "@sankhuu/db";
import { getCurrentUser } from "@/lib/auth";

// Дуртай бараа нэмэх/хасах. Нэвтрээгүй бол { auth: false } буцаана (клиент нэвтрэх хуудас руу).
export async function toggleFavorite(productId: string): Promise<{ auth: boolean; on: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { auth: false, on: false };
  const existing = await prisma.favorite.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { auth: true, on: false };
  }
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true }, select: { id: true } });
  if (!product) return { auth: true, on: false };
  await prisma.favorite.create({ data: { userId: user.id, productId } });
  return { auth: true, on: true };
}
