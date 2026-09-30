"use server";

import { redirect } from "next/navigation";
import { prisma, type Prisma } from "@sankhuu/db";
import { normalizeMongolianPhone } from "@/lib/phone";
import { DISTRICTS } from "@/lib/districts";
import { deliveryFeeFor } from "@/lib/delivery-fee";

export type CheckoutState = { error?: string; values?: Record<string, string> };
type CartLine = { productId: string; qty: number };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function placeOrder(slug: string, _prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
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

  const shop = await prisma.shop.findFirst({ where: { slug, isActive: true }, include: { pickupAddress: true } });
  if (!shop) return fail("Дэлгүүр олдсонгүй.");
  if (!shop.pickupAddress) return fail("Дэлгүүр хүргэлтийн тохиргоогоо хийгээгүй байна. Дэлгүүртэй холбогдоно уу.");
  const pickupAddressId = shop.pickupAddress.id;

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, shopId: shop.id, isActive: true },
  });
  if (products.length !== lines.length) return fail("Сагсан дахь зарим бараа олдсонгүй. Сагсаа шинэчилнэ үү.");

  const items = lines.map((l) => {
    const p = products.find((x) => x.id === l.productId)!;
    return { productId: p.id, name: p.name, unitPrice: p.price, quantity: l.qty };
  });
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);

  let orderNumber: number;
  try {
    orderNumber = await prisma.$transaction(async (tx) => {
      // Үлдэгдэл хүрэлцэж байвал л хасна (зэрэг захиалахаас хамгаална)
      for (const it of items) {
        const r = await tx.product.updateMany({
          where: { id: it.productId, stock: { gte: it.quantity } },
          data: { stock: { decrement: it.quantity } },
        });
        if (r.count === 0) throw new StockError(it.name);
      }

      const customer = await tx.customer.upsert({
        where: { shopId_phone: { shopId: shop.id, phone } },
        update: { name: values.name },
        create: { shopId: shop.id, phone, name: values.name },
      });
      const address = await tx.address.create({
        data: { customerId: customer.id, district: values.district, khoroo: values.khoroo || null, details: values.details },
      });

      const orderData: Prisma.OrderCreateInput = {
        shop: { connect: { id: shop.id } },
        customer: { connect: { id: customer.id } },
        source: "OTHER",
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        paymentMethod: "CASH_ON_DELIVERY",
        note: values.note || null,
        items: { create: items },
        delivery: {
          create: {
            pickupAddressId,
            dropoffAddressId: address.id,
            fee: deliveryFee,
            codAmount: subtotal + deliveryFee,
            events: { create: { status: "PENDING", note: "Худалдан авагч онлайнаар захиалав" } },
          },
        },
      };
      const order = await tx.order.create({ data: orderData, select: { number: true } });
      return order.number;
    });
  } catch (e) {
    if (e instanceof StockError) return fail(`"${e.productName}" барааны үлдэгдэл хүрэлцэхгүй байна. Тоо ширхэгээ багасгана уу.`);
    throw e;
  }

  redirect(`/s/${slug}/order/${orderNumber}?phone=${encodeURIComponent(phone)}`);
}

class StockError extends Error {
  constructor(public productName: string) {
    super("stock");
  }
}
