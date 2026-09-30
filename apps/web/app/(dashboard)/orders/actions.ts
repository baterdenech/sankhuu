"use server";

import { revalidatePath } from "next/cache";
import { prisma, type OrderStatus } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";

// Худалдагчийн хийж болох шилжилтүүд
const ALLOWED: Partial<Record<OrderStatus, OrderStatus[]>> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["CANCELLED"],
};

export async function setOrderStatus(orderId: string, next: OrderStatus) {
  const { shop, user } = await requireShop();
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, shopId: shop.id }, include: { items: true, delivery: true } });
    if (!order || !ALLOWED[order.status]?.includes(next)) return;

    await tx.order.update({ where: { id: order.id }, data: { status: next } });

    if (next === "CANCELLED") {
      // Үлдэгдлийг буцаана, хүргэлтийг цуцална
      for (const it of order.items) {
        if (it.productId) await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
      }
      if (order.delivery && order.delivery.status === "PENDING") {
        await tx.delivery.update({ where: { id: order.delivery.id }, data: { status: "CANCELLED" } });
        await tx.deliveryEvent.create({ data: { deliveryId: order.delivery.id, status: "CANCELLED", actorId: user.id, note: "Худалдагч захиалгыг цуцлав" } });
      }
    }
  });
  revalidatePath("/orders");
  revalidatePath("/");
  revalidatePath("/products");
}
