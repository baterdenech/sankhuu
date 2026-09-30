"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma, type OrderStatus } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { notifyOrder, type NotifyKind } from "@/lib/notify";

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
  const applied = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, shopId: shop.id }, include: { items: true, delivery: true } });
    if (!order || !ALLOWED[order.status]?.includes(next)) return false;
    // Жолооч оноогдсон бол хүргэлтийн статусыг жолооч л өөрчилнө
    if ((next === "IN_DELIVERY" || next === "DELIVERED") && order.delivery?.driverId) return false;

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
    return true;
  });
  const SMS_FOR: Partial<Record<OrderStatus, NotifyKind>> = { CONFIRMED: "ORDER_CONFIRMED", IN_DELIVERY: "IN_DELIVERY", DELIVERED: "DELIVERED", CANCELLED: "CANCELLED" };
  const kind = SMS_FOR[next];
  if (applied && kind) after(() => notifyOrder(orderId, kind));
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/products");
}

// ─── Гар захиалга: утсаар/чатаар ирсэн захиалгыг худалдагч өөрөө бүртгэнэ ───
// Захиалга CONFIRMED статустай үүсч (худалдагч аль хэдийн баталгаажуулсан), хүргэлт PENDING үүснэ, үлдэгдэл хасагдана.
import { redirect } from "next/navigation";
import { normalizeMongolianPhone } from "@/lib/phone";
import { DISTRICTS } from "@/lib/districts";
import { deliveryFeeFor } from "@/lib/delivery-fee";

export type ManualOrderState = { error?: string; values?: Record<string, string> };
type Line = { productId: string; qty: number };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function createManualOrder(_prev: ManualOrderState, fd: FormData): Promise<ManualOrderState> {
  const { shop } = await requireShop();
  const values = { name: str(fd, "name"), phone: str(fd, "phone"), district: str(fd, "district"), khoroo: str(fd, "khoroo"), details: str(fd, "details"), note: str(fd, "note"), source: str(fd, "source"), payment: str(fd, "payment"), items: str(fd, "items") };
  const fail = (error: string): ManualOrderState => ({ error, values });

  const phone = normalizeMongolianPhone(values.phone);
  if (values.name.length < 2) return fail("Худалдан авагчийн нэрийг оруулна уу.");
  if (!phone) return fail("Утасны дугаараа зөв оруулна уу (8 оронтой).");
  if (!(DISTRICTS as readonly string[]).includes(values.district)) return fail("Дүүргээ сонгоно уу.");
  const deliveryFee = deliveryFeeFor(values.district);
  if (deliveryFee === null) return fail("Энэ бүсэд одоогоор хүргэлт хийхгүй байна.");
  if (values.details.length < 5) return fail("Хаягаа дэлгэрэнгүй бичнэ үү (байр, орц, тоот).");
  if (!shop.pickupAddress) return fail("Тохиргоо хэсэгт барааг авах хаягаа оруулна уу.");
  const source = values.source === "PHONE" ? "PHONE" : "OTHER";
  const paymentMethod = values.payment === "PREPAID_TRANSFER" ? "PREPAID_TRANSFER" : "CASH_ON_DELIVERY";

  let lines: Line[] = [];
  try {
    lines = JSON.parse(values.items);
  } catch {}
  lines = lines.filter((l) => typeof l.productId === "string" && Number.isInteger(l.qty) && l.qty > 0);
  if (lines.length === 0) return fail("Дор хаяж нэг бараа сонгоно уу.");

  const products = await prisma.product.findMany({ where: { id: { in: lines.map((l) => l.productId) }, shopId: shop.id, isActive: true } });
  if (products.length !== lines.length) return fail("Зарим бараа олдсонгүй.");
  const items = lines.map((l) => {
    const p = products.find((x) => x.id === l.productId)!;
    return { productId: p.id, name: p.name, unitPrice: p.price, quantity: l.qty };
  });
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = subtotal + deliveryFee;

  let orderId: string;
  try {
    orderId = await prisma.$transaction(async (tx) => {
      for (const it of items) {
        const r = await tx.product.updateMany({ where: { id: it.productId, stock: { gte: it.quantity } }, data: { stock: { decrement: it.quantity } } });
        if (r.count === 0) throw new Error(`stock:${it.name}`);
      }
      const customer = await tx.customer.upsert({ where: { shopId_phone: { shopId: shop.id, phone } }, update: { name: values.name }, create: { shopId: shop.id, phone, name: values.name } });
      const address = await tx.address.create({ data: { customerId: customer.id, district: values.district, khoroo: values.khoroo || null, details: values.details } });
      const order = await tx.order.create({
        data: {
          shop: { connect: { id: shop.id } },
          customer: { connect: { id: customer.id } },
          source,
          status: "CONFIRMED",
          subtotal,
          deliveryFee,
          total,
          paymentMethod,
          paymentStatus: paymentMethod === "PREPAID_TRANSFER" ? "PAID" : "UNPAID",
          note: values.note || null,
          items: { create: items },
          delivery: {
            create: {
              pickupAddressId: shop.pickupAddress!.id,
              dropoffAddressId: address.id,
              fee: deliveryFee,
              // Урьдчилж төлсөн бол жолооч мөнгө авахгүй
              codAmount: paymentMethod === "PREPAID_TRANSFER" ? 0 : total,
              events: { create: { status: "PENDING", note: "Худалдагч гараар бүртгэв" } },
            },
          },
        },
        select: { id: true },
      });
      return order.id;
    });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("stock:")) return fail(`"${e.message.slice(6)}" барааны үлдэгдэл хүрэлцэхгүй байна.`);
    throw e;
  }

  after(() => notifyOrder(orderId, "ORDER_CONFIRMED"));
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/admin");
  redirect("/orders");
}
