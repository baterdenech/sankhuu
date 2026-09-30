"use server";

import { redirect } from "next/navigation";
import { prisma, type Prisma } from "@sankhuu/db";
import { normalizeMongolianPhone } from "@/lib/phone";
import { DISTRICTS } from "@/lib/districts";
import { deliveryFeeFor } from "@/lib/delivery-fee";

export type CheckoutState = { error?: string; values?: Record<string, string> };
type CartLine = { productId: string; qty: number };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

class StockError extends Error {
  constructor(public productName: string) {
    super("stock");
  }
}

// Нэг сагснаас дэлгүүр бүрт тусдаа захиалга үүсгэнэ (хүргэлтийн төлбөр дэлгүүр тус бүрт)
export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values = {
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    district: str(formData, "district"),
    khoroo: str(formData, "khoroo"),
    details: str(formData, "details"),
    note: str(formData, "note"),
  };
  const fail = (error: string): CheckoutState => ({ error, values });

  const phone = normalizeMongolianPhone(values.phone);
  if (values.name.length < 2) return fail("Нэрээ оруулна уу.");
  if (!phone) return fail("Утасны дугаараа зөв оруулна уу (8 оронтой).");
  if (!(DISTRICTS as readonly string[]).includes(values.district)) return fail("Дүүргээ сонгоно уу.");
  const deliveryFee = deliveryFeeFor(values.district);
  if (deliveryFee === null) return fail("Уучлаарай, энэ бүсэд одоогоор хүргэлт хийхгүй байна.");
  if (values.details.length < 5) return fail("Хаягаа дэлгэрэнгүй бичнэ үү (байр, орц, тоот).");

  let lines: CartLine[] = [];
  try {
    lines = JSON.parse(str(formData, "cart"));
  } catch {}
  lines = lines.filter((l) => typeof l.productId === "string" && Number.isInteger(l.qty) && l.qty > 0);
  if (lines.length === 0) return fail("Сагс хоосон байна.");

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, isActive: true, shop: { isActive: true } },
    include: { shop: { include: { pickupAddress: true } } },
  });
  if (products.length !== lines.length) return fail("Сагсан дахь зарим бараа олдсонгүй. Сагсаа шинэчилнэ үү.");
  const noPickup = products.find((p) => !p.shop.pickupAddress);
  if (noPickup) return fail(`"${noPickup.shop.name}" дэлгүүр хүргэлтийн тохиргоогоо хийгээгүй байна.`);

  // Дэлгүүрээр бүлэглэнэ
  const byShop = new Map<string, { shopId: string; pickupAddressId: string; items: { productId: string; name: string; unitPrice: number; quantity: number }[] }>();
  for (const l of lines) {
    const p = products.find((x) => x.id === l.productId)!;
    const g = byShop.get(p.shopId) ?? { shopId: p.shopId, pickupAddressId: p.shop.pickupAddress!.id, items: [] };
    g.items.push({ productId: p.id, name: p.name, unitPrice: p.price, quantity: l.qty });
    byShop.set(p.shopId, g);
  }

  let numbers: number[];
  try {
    numbers = await prisma.$transaction(async (tx) => {
      const out: number[] = [];
      for (const g of byShop.values()) {
        for (const it of g.items) {
          const r = await tx.product.updateMany({ where: { id: it.productId, stock: { gte: it.quantity } }, data: { stock: { decrement: it.quantity } } });
          if (r.count === 0) throw new StockError(it.name);
        }
        const customer = await tx.customer.upsert({
          where: { shopId_phone: { shopId: g.shopId, phone } },
          update: { name: values.name },
          create: { shopId: g.shopId, phone, name: values.name },
        });
        const address = await tx.address.create({
          data: { customerId: customer.id, district: values.district, khoroo: values.khoroo || null, details: values.details },
        });
        const subtotal = g.items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
        const data: Prisma.OrderCreateInput = {
          shop: { connect: { id: g.shopId } },
          customer: { connect: { id: customer.id } },
          source: "OTHER",
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          paymentMethod: "CASH_ON_DELIVERY",
          note: values.note || null,
          items: { create: g.items },
          delivery: {
            create: {
              pickupAddressId: g.pickupAddressId,
              dropoffAddressId: address.id,
              fee: deliveryFee,
              codAmount: subtotal + deliveryFee,
              events: { create: { status: "PENDING", note: "Худалдан авагч апп-аар захиалав" } },
            },
          },
        };
        const order = await tx.order.create({ data, select: { number: true } });
        out.push(order.number);
      }
      return out;
    });
  } catch (e) {
    if (e instanceof StockError) return fail(`"${e.productName}" барааны үлдэгдэл хүрэлцэхгүй байна. Тоо ширхэгээ багасгана уу.`);
    throw e;
  }

  redirect(`/orders/done?n=${numbers.join(",")}&phone=${encodeURIComponent(phone)}`);
}

// "Миний" хуудас: төхөөрөмж дээр хадгалсан (дугаар, утас) хосуудаар захиалгуудыг татна
export async function getMyOrders(keys: { number: number; phone: string }[]) {
  const valid = keys.filter((k) => Number.isInteger(k.number) && typeof k.phone === "string").slice(0, 50);
  if (valid.length === 0) return [];
  const orders = await prisma.order.findMany({
    where: { OR: valid.map((k) => ({ number: k.number, customer: { phone: k.phone } })) },
    include: { shop: { select: { name: true, slug: true } }, items: true, delivery: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((o) => ({
    number: o.number,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    shop: o.shop,
    items: o.items.map((i) => ({ name: i.name, quantity: i.quantity })),
    phone: valid.find((k) => k.number === o.number)!.phone,
  }));
}
