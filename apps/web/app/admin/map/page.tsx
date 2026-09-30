import Link from "next/link";
import { prisma } from "@sankhuu/db";
import { requireAdmin } from "@/lib/roles";
import { formatPhone } from "@/lib/phone";
import { DispatchMap, type MapDelivery, type MapDriver } from "./dispatch-map";

export const dynamic = "force-dynamic";

// Диспетчерийн газрын зураг: жолоочдын сүүлийн байршил, идэвхтэй хүргэлтүүдийн цэгүүд
export default async function AdminMapPage() {
  await requireAdmin();
  const [driverRows, deliveryRows] = await Promise.all([
    prisma.driver.findMany({
      where: { user: { isActive: true }, lastLat: { not: null }, lastLng: { not: null } },
      include: { user: { select: { name: true, username: true, phone: true } }, _count: { select: { deliveries: { where: { status: { in: ["ASSIGNED", "PICKED_UP"] } } } } } },
    }),
    prisma.delivery.findMany({
      where: { status: { in: ["PENDING", "ASSIGNED", "PICKED_UP"] } },
      include: { order: { select: { number: true, shop: { select: { name: true } }, customer: { select: { name: true } } } }, pickupAddress: true, dropoffAddress: true, driver: { include: { user: { select: { name: true, username: true } } } } },
      orderBy: { createdAt: "asc" },
      take: 300,
    }),
  ]);
  const drivers: MapDriver[] = driverRows.map((d) => ({ id: d.id, name: d.user.name ?? d.user.username ?? "Жолооч", phone: d.user.phone ? formatPhone(d.user.phone) : null, online: d.isOnline, load: d._count.deliveries, lat: d.lastLat!, lng: d.lastLng!, seenAt: d.lastSeenAt?.toISOString() ?? null }));
  const deliveries: MapDelivery[] = deliveryRows.map((x) => ({
    id: x.id,
    number: x.order.number,
    status: x.status as MapDelivery["status"],
    driver: x.driver ? (x.driver.user.name ?? x.driver.user.username) : null,
    shop: x.order.shop.name,
    customer: x.order.customer.name,
    pickup: x.pickupAddress.lat != null && x.pickupAddress.lng != null ? { lat: x.pickupAddress.lat, lng: x.pickupAddress.lng } : null,
    dropoff: x.dropoffAddress.lat != null && x.dropoffAddress.lng != null ? { lat: x.dropoffAddress.lat, lng: x.dropoffAddress.lng } : null,
    cod: x.codAmount,
  }));
  const noCoords = deliveries.filter((d) => !d.dropoff);

  return (
    <>
      <div className="page-head">
        <h1>Газрын зураг</h1>
        <span className="muted small-text">
          {drivers.filter((d) => d.online).length} онлайн жолооч · {deliveries.length} идэвхтэй хүргэлт · 30 сек тутам шинэчлэгдэнэ
        </span>
      </div>
      <div className="map-legend">
        <span>
          <i style={{ background: "#16a34a" }} /> Онлайн жолооч
        </span>
        <span>
          <i style={{ background: "#9a9a9a" }} /> Офлайн
        </span>
        <span>
          <i style={{ background: "#b45309" }} /> Хүлээгдэж буй
        </span>
        <span>
          <i style={{ background: "#1d4ed8" }} /> Оноосон
        </span>
        <span>
          <i style={{ background: "#6d28d9" }} /> Замд
        </span>
        <span>
          <i className="ring" /> Авах (дэлгүүр)
        </span>
      </div>
      <DispatchMap drivers={drivers} deliveries={deliveries} />
      {noCoords.length > 0 && (
        <p className="muted small-text" style={{ marginTop: 10 }}>
          Газрын зураг дээр байхгүй (худалдан авагч цэг заагаагүй): {noCoords.map((d) => `#${d.number}`).join(", ")}. Хаягийг <Link href="/admin">самбар</Link> дээрээс харна.
        </p>
      )}
      {drivers.length === 0 && <p className="muted small-text">Жолооч онлайн болж, үйлдэл хийсний дараа байршил нь энд гарна.</p>}
    </>
  );
}
