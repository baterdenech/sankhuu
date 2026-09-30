import { prisma } from "@sankhuu/db";
import { requireDriver } from "@/lib/roles";
import { formatMNT } from "@/lib/labels";
import { cashOnHand } from "@/lib/delivery";

export const dynamic = "force-dynamic";

// Жолоочийн гар дээрх бэлэн мөнгө ба оффист тушаасан түүх
export default async function DriverCashPage() {
  const { driver } = await requireDriver();
  const [cash, pending, handovers] = await Promise.all([
    cashOnHand(driver.id),
    prisma.delivery.findMany({ where: { driverId: driver.id, status: "DELIVERED", cashHandoverId: null }, include: { order: { select: { number: true, customer: { select: { name: true } } } } }, orderBy: { deliveredAt: "desc" } }),
    prisma.cashHandover.findMany({ where: { driverId: driver.id }, include: { _count: { select: { deliveries: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return (
    <>
      <div className="cash-hero">
        <span className="muted small-text">Оффист тушаах бэлэн мөнгө</span>
        <strong>{formatMNT(cash.amount)}</strong>
        <span className="muted small-text">{cash.count} хүргэлтээс</span>
      </div>
      {pending.length > 0 && (
        <>
          <h2 className="section-title">Тушаагаагүй</h2>
          <ul className="list">
            {pending.map((d) => (
              <li key={d.id} className="list-row">
                <span className="list-row-body">
                  <strong>
                    #{d.order.number} · {d.order.customer.name}
                  </strong>
                  <span className="muted small-text">{d.deliveredAt?.toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" })}</span>
                </span>
                <strong>{formatMNT(d.codCollected)}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="section-title">Тушаасан</h2>
      {handovers.length === 0 ? (
        <div className="empty">Одоогоор тушаалт алга.</div>
      ) : (
        <ul className="list">
          {handovers.map((h) => (
            <li key={h.id} className="list-row">
              <span className="list-row-body">
                <strong>{h.createdAt.toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" })}</strong>
                <span className="muted small-text">{h._count.deliveries} хүргэлт</span>
              </span>
              <strong>{formatMNT(h.amount)}</strong>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small-text pad">Мөнгөө оффист өгөхөд диспетчер "Хүлээн авлаа" гэж тэмдэглэхэд энд шилжинэ.</p>
    </>
  );
}
