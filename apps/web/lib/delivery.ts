import { prisma, type DeliveryStatus, type Prisma } from "@sankhuu/db";

// ─── Хүргэлтийн статусын шилжилт (диспетчер, жолооч хоёулаа энэ модулиар) ───
// Дүрэм: статус өөрчлөгдөх бүрт DeliveryEvent бичнэ; захиалгын статусыг хамт шинэчилнэ.

export type Geo = { lat?: number; lng?: number } | null | undefined;
type Tx = Prisma.TransactionClient;

export class DeliveryError extends Error {}

const ASSIGNABLE: DeliveryStatus[] = ["PENDING", "ASSIGNED", "FAILED"];

async function event(tx: Tx, deliveryId: string, status: DeliveryStatus, actorId: string, note?: string | null, geo?: Geo) {
  await tx.deliveryEvent.create({ data: { deliveryId, status, actorId, note: note ?? null, lat: geo?.lat ?? null, lng: geo?.lng ?? null } });
}

// Диспетчер: жолоочид онооно (дахин оноох, амжилтгүй болсныг дахин оноох боломжтой)
export async function assignDelivery(deliveryId: string, driverId: string, actorId: string) {
  await prisma.$transaction(async (tx) => {
    const d = await tx.delivery.findUnique({ where: { id: deliveryId }, include: { order: { select: { status: true } } } });
    if (!d) throw new DeliveryError("Хүргэлт олдсонгүй.");
    if (!ASSIGNABLE.includes(d.status)) throw new DeliveryError("Энэ хүргэлтийг одоо оноох боломжгүй.");
    if (d.order.status === "CANCELLED" || d.order.status === "RETURNED") throw new DeliveryError("Захиалга цуцлагдсан байна.");
    const driver = await tx.driver.findFirst({ where: { id: driverId, user: { isActive: true } }, include: { user: { select: { name: true, username: true } } } });
    if (!driver) throw new DeliveryError("Жолооч олдсонгүй.");
    await tx.delivery.update({ where: { id: d.id }, data: { driverId: driver.id, status: "ASSIGNED", assignedAt: new Date(), failReason: null } });
    await event(tx, d.id, "ASSIGNED", actorId, `Жолооч: ${driver.user.name ?? driver.user.username ?? ""}`.trim());
  });
}

// Диспетчер: оноолтыг цуцалж хүлээгдэж буй болгоно
export async function unassignDelivery(deliveryId: string, actorId: string) {
  await prisma.$transaction(async (tx) => {
    const d = await tx.delivery.findUnique({ where: { id: deliveryId } });
    if (!d || d.status !== "ASSIGNED") throw new DeliveryError("Зөвхөн оноосон хүргэлтийг буцаана.");
    await tx.delivery.update({ where: { id: d.id }, data: { driverId: null, status: "PENDING", assignedAt: null } });
    await event(tx, d.id, "PENDING", actorId, "Оноолтыг цуцлав");
  });
}

// Жолооч: барааг дэлгүүрээс авлаа → захиалга IN_DELIVERY
export async function pickUpDelivery(deliveryId: string, driverId: string, actorId: string, geo?: Geo) {
  await prisma.$transaction(async (tx) => {
    const d = await tx.delivery.findFirst({ where: { id: deliveryId, driverId } });
    if (!d || d.status !== "ASSIGNED") throw new DeliveryError("Энэ хүргэлт танд оноогдоогүй эсвэл аль хэдийн авсан байна.");
    await tx.delivery.update({ where: { id: d.id }, data: { status: "PICKED_UP", pickedUpAt: new Date() } });
    await tx.order.update({ where: { id: d.orderId }, data: { status: "IN_DELIVERY" } });
    await event(tx, d.id, "PICKED_UP", actorId, "Жолооч барааг авав", geo);
    await touchDriver(tx, driverId, geo);
  });
}

// Жолооч: хүргэж, мөнгөө цуглуулав → захиалга DELIVERED, төлбөр PAID
export async function completeDelivery(deliveryId: string, driverId: string, actorId: string, collected: number, geo?: Geo) {
  await prisma.$transaction(async (tx) => {
    const d = await tx.delivery.findFirst({ where: { id: deliveryId, driverId } });
    if (!d || d.status !== "PICKED_UP") throw new DeliveryError("Эхлээд барааг авсан гэж тэмдэглэнэ үү.");
    if (!Number.isInteger(collected) || collected < 0) throw new DeliveryError("Цуглуулсан дүн буруу байна.");
    await tx.delivery.update({ where: { id: d.id }, data: { status: "DELIVERED", deliveredAt: new Date(), codCollected: collected } });
    await tx.order.update({ where: { id: d.orderId }, data: { status: "DELIVERED", paymentStatus: "PAID" } });
    await event(tx, d.id, "DELIVERED", actorId, collected > 0 ? `Бэлнээр ${collected.toLocaleString("en-US")}₮ авав` : "Хүргэв (төлбөр урьдчилсан)", geo);
    await touchDriver(tx, driverId, geo);
  });
}

// Жолооч: хүргэж чадсангүй (хүлээн авагч олдоогүй, татгалзсан г.м.)
export async function failDelivery(deliveryId: string, driverId: string, actorId: string, reason: string, geo?: Geo) {
  await prisma.$transaction(async (tx) => {
    const d = await tx.delivery.findFirst({ where: { id: deliveryId, driverId } });
    if (!d || (d.status !== "PICKED_UP" && d.status !== "ASSIGNED")) throw new DeliveryError("Энэ хүргэлтийг амжилтгүй болгох боломжгүй.");
    await tx.delivery.update({ where: { id: d.id }, data: { status: "FAILED", failReason: reason } });
    await event(tx, d.id, "FAILED", actorId, reason, geo);
    await touchDriver(tx, driverId, geo);
  });
}

// Диспетчер: амжилтгүй хүргэлтийн барааг дэлгүүрт буцаав → захиалга RETURNED, үлдэгдэл буцна
export async function returnDeliveryToShop(deliveryId: string, actorId: string) {
  await prisma.$transaction(async (tx) => {
    const d = await tx.delivery.findUnique({ where: { id: deliveryId }, include: { order: { include: { items: true } } } });
    if (!d || d.status !== "FAILED") throw new DeliveryError("Зөвхөн амжилтгүй хүргэлтийг буцаана.");
    await tx.delivery.update({ where: { id: d.id }, data: { status: "RETURNED_TO_SHOP" } });
    await tx.order.update({ where: { id: d.orderId }, data: { status: "RETURNED" } });
    for (const it of d.order.items) {
      if (it.productId) await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
    }
    await event(tx, d.id, "RETURNED_TO_SHOP", actorId, "Барааг дэлгүүрт буцаав");
  });
}

async function touchDriver(tx: Tx, driverId: string, geo?: Geo) {
  await tx.driver.update({
    where: { id: driverId },
    data: { lastSeenAt: new Date(), ...(geo?.lat != null && geo?.lng != null ? { lastLat: geo.lat, lastLng: geo.lng } : {}) },
  });
}

// Жолоочийн гар дээрх бэлэн мөнгө: хүргэсэн боловч оффист тушаагаагүй дүн
export async function cashOnHand(driverId: string) {
  const r = await prisma.delivery.aggregate({ _sum: { codCollected: true }, _count: true, where: { driverId, status: "DELIVERED", cashHandoverId: null } });
  return { amount: r._sum.codCollected ?? 0, count: r._count };
}

// Газрын зурагт нээх холбоос (lat/lng байвал цэгээр, үгүй бол хаягийн текстээр)
export function mapsUrl(a: { district: string; khoroo?: string | null; details: string; lat?: number | null; lng?: number | null }) {
  const q = a.lat != null && a.lng != null ? `${a.lat},${a.lng}` : `Улаанбаатар, ${a.district}${a.khoroo ? ` ${a.khoroo}-р хороо` : ""}, ${a.details}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function formatAddress(a: { district: string; khoroo?: string | null; details: string }) {
  return `${a.district}${a.khoroo ? `, ${a.khoroo}-р хороо` : ""}, ${a.details}`;
}
