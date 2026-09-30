import { prisma } from "@sankhuu/db";
import { sendSms } from "@/lib/sms";
import { siteUrl } from "@/lib/og";
import { formatPhone } from "@/lib/phone";

// ─── Захиалгын мэдэгдлүүд (SMS) ─────────────────────────────────────────────
// Кирилл SMS 70 тэмдэгт/сегмент тул текстийг богино байлгана. Алдаа гарвал залгиж, үндсэн үйлдлийг зогсоохгүй.

export type NotifyKind = "ORDER_PLACED" | "SELLER_NEW_ORDER" | "ORDER_CONFIRMED" | "IN_DELIVERY" | "DELIVERED" | "DELIVERY_FAILED" | "CANCELLED";

const mnt = (n: number) => `${n.toLocaleString("en-US")}₮`;

function receiptLink(number: number, phone: string) {
  return `${siteUrl()}/orders/done?n=${number}&phone=${encodeURIComponent(phone)}`;
}

async function load(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shop: { select: { name: true, phone: true } },
      customer: { select: { name: true, phone: true } },
      items: { select: { quantity: true } },
      delivery: { include: { driver: { include: { user: { select: { name: true, username: true, phone: true } } } } } },
    },
  });
}

export async function notifyOrder(orderId: string, kind: NotifyKind, extra?: { reason?: string }) {
  try {
    const o = await load(orderId);
    if (!o) return;
    const n = o.number;
    const cust = o.customer.phone;
    const driver = o.delivery?.driver?.user;
    const driverLine = driver ? ` Жолооч ${driver.name ?? driver.username ?? ""}${driver.phone ? ` ${formatPhone(driver.phone)}` : ""}.` : "";

    switch (kind) {
      case "ORDER_PLACED":
        await sendSms({ to: cust, kind, orderId, text: `Sankhuu: #${n} захиалгыг хүлээн авлаа. ${o.shop.name} баталгаажуулмагц мэдэгдэнэ. ${receiptLink(n, cust)}` });
        break;
      case "SELLER_NEW_ORDER": {
        const qty = o.items.reduce((s, i) => s + i.quantity, 0);
        await sendSms({ to: o.shop.phone, kind, orderId, text: `Sankhuu: Шинэ захиалга #${n}, ${qty} бараа, ${mnt(o.total)}. ${o.customer.name} ${formatPhone(cust)}. ${siteUrl()}/orders` });
        break;
      }
      case "ORDER_CONFIRMED":
        await sendSms({ to: cust, kind, orderId, text: `Sankhuu: #${n} захиалга баталгаажлаа. Хүргэхэд ${mnt(o.total)} төлнө. Асуулт: ${o.shop.name} ${formatPhone(o.shop.phone)}` });
        break;
      case "IN_DELIVERY":
        await sendSms({ to: cust, kind, orderId, text: `Sankhuu: #${n} захиалга хүргэлтэд гарлаа.${driverLine} Хүлээж аваад ${mnt(o.total)} төлнө.` });
        break;
      case "DELIVERED":
        await sendSms({ to: cust, kind, orderId, text: `Sankhuu: #${n} захиалга хүргэгдлээ. Баярлалаа! Үнэлгээ өгөх: ${siteUrl()}/me` });
        break;
      case "DELIVERY_FAILED":
        await sendSms({ to: cust, kind, orderId, text: `Sankhuu: #${n} хүргэлт амжилтгүй (${extra?.reason ?? "холбогдож чадсангүй"}).${driverLine || ` ${o.shop.name} ${formatPhone(o.shop.phone)}.`} Дахин холбогдоно.` });
        break;
      case "CANCELLED":
        await sendSms({ to: cust, kind, orderId, text: `Sankhuu: #${n} захиалга цуцлагдлаа. Асуулт байвал ${o.shop.name} ${formatPhone(o.shop.phone)}.` });
        break;
    }
  } catch (e) {
    console.error("notifyOrder", kind, e);
  }
}
