"use server";

import { revalidatePath } from "next/cache";
import { prisma, type OrderStatus } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";

// Худалдагчийн хийж болох шилжилтүүд
// IN_DELIVERY / DELIVERED-ийг жолоочийн апп гартал худалдагч өөрөө тэмдэглэнэ
const ALLOWED: Partial<Record<OrderStatus, OrderStatus[]>> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["IN_DELIVERY", "CANCELLED"],
  IN_DELIVERY: ["DELIVERED"],
};
const DELIVERY_FOR: Partial<Record<OrderStatus, { status: "PICKED_UP" | "DELIVERED"; note: string }>> = {
  IN_DELIVERY: { status: "PICKED_UP", note: "Худалдагч хүргэлтэд гаргав" },
  DELIVERED: { status: "DELIVERED", note: "Худалдагч хүргэгдсэн гэж тэмдэглэв" },
};

export async function setOrderStatus(orderId: string, next: OrderStatus) {
  const { shop, user } = await requireShop();
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, shopId: shop.id }, include: { items: true, delivery: true } });
    if (!order || !ALLOWED[order.status]?.includes(next)) return;
    // Жолооч оноогдсон бол хүргэлтийн статусыг жолооч л өөрчилнө
    if ((next === "IN_DELIVERY" || next === "DELIVERED") && order.delivery?.driverId) return;

    await tx.order.update({ where: { id: order.id }, data: { status: next, ...(next === "DELIVERED" ? { paymentStatus: "PAID" } : {}) } });

    const d = DELIVERY_FOR[next];
    if (d && order.delivery) {
      await tx.delivery.update({
        where: { id: order.delivery.id },
        data: { status: d.status, ...(d.status === "PICKED_UP" ? { pickedUpAt: new Date() } : { deliveredAt: new Date(), codCollected: order.delivery.codAmount }) },
      });
      await tx.deliveryEvent.create({ data: { deliveryId: order.delivery.id, status: d.status, actorId: user.id, note: d.note } });
    }

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
  revalidatePath("/dashboard");
  revalidatePath("/products");
}
