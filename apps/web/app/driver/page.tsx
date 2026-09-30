import { prisma } from "@sankhuu/db";
import { requireDriver } from "@/lib/roles";
import { formatMNT } from "@/lib/labels";
import { cashOnHand, formatAddress, mapsUrl } from "@/lib/delivery";
import { DeliveryCard, type DriverDelivery } from "./delivery-card";

export const dynamic = "force-dynamic";

// Өнөөдрийн ажил: эхлээд дэлгүүрээс авах (ASSIGNED), дараа нь хүргэх (PICKED_UP)
export default async function DriverHomePage() {
  const { driver } = await requireDriver();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [rows, doneToday, cash] = await Promise.all([
    prisma.delivery.findMany({
      where: { driverId: driver.id, status: { in: ["ASSIGNED", "PICKED_UP"] } },
      include: {
        order: { include: { customer: true, shop: { select: { name: true, phone: true } }, items: { select: { name: true, quantity: true } } } },
        pickupAddress: true,
        dropoffAddress: true,
      },
      orderBy: [{ status: "desc" }, { assignedAt: "asc" }],
    }),
    prisma.delivery.count({ where: { driverId: driver.id, status: "DELIVERED", deliveredAt: { gte: startOfDay } } }),
    cashOnHand(driver.id),
  ]);
  const list: DriverDelivery[] = rows.map((d) => ({
    id: d.id,
    status: d.status as "ASSIGNED" | "PICKED_UP",
    orderNumber: d.order.number,
    shopName: d.order.shop.name,
    shopPhone: d.order.shop.phone,
    pickup: { text: formatAddress(d.pickupAddress), maps: mapsUrl(d.pickupAddress) },
    customerName: d.order.customer.name,
    customerPhone: d.order.customer.phone,
    dropoff: { text: formatAddress(d.dropoffAddress), maps: mapsUrl(d.dropoffAddress) },
    items: d.order.items,
    codAmount: d.codAmount,
    note: d.order.note,
    assignedAt: d.assignedAt?.toISOString() ?? null,
  }));
  const toDeliver = list.filter((d) => d.status === "PICKED_UP");
  const toPick = list.filter((d) => d.status === "ASSIGNED");

  return (
    <>
      <div className="driver-stats">
        <div>
          <span className="muted small-text">Замд</span>
          <strong>{toDeliver.length}</strong>
        </div>
        <div>
          <span className="muted small-text">Авах</span>
          <strong>{toPick.length}</strong>
        </div>
        <div>
          <span className="muted small-text">Өнөөдөр хүргэсэн</span>
          <strong>{doneToday}</strong>
        </div>
        <div>
          <span className="muted small-text">Гар дээрх</span>
          <strong>{formatMNT(cash.amount)}</strong>
        </div>
      </div>

      {list.length === 0 && (
        <div className="empty tall">
          <p>Одоогоор оноосон хүргэлт алга.</p>
          <p className="muted small-text">{driver.isOnline ? "Диспетчер хүргэлт оноомогц энд гарч ирнэ." : "Онлайн болвол диспетчер танд хүргэлт оноох боломжтой."}</p>
        </div>
      )}

      {toDeliver.length > 0 && (
        <>
          <h2 className="section-title">Хүргэх ({toDeliver.length})</h2>
          <ul className="dlist">
            {toDeliver.map((d) => (
              <DeliveryCard key={d.id} d={d} />
            ))}
          </ul>
        </>
      )}
      {toPick.length > 0 && (
        <>
          <h2 className="section-title">Дэлгүүрээс авах ({toPick.length})</h2>
          <ul className="dlist">
            {toPick.map((d) => (
              <DeliveryCard key={d.id} d={d} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
