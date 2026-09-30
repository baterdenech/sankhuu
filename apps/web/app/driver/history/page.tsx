import { prisma } from "@sankhuu/db";
import { requireDriver } from "@/lib/roles";
import { deliveryStatusLabel, formatMNT } from "@/lib/labels";
import { formatAddress } from "@/lib/delivery";

export const dynamic = "force-dynamic";

export default async function DriverHistoryPage() {
  const { driver } = await requireDriver();
  const since = new Date(Date.now() - 30 * 86400000);
  const rows = await prisma.delivery.findMany({
    where: { driverId: driver.id, status: { in: ["DELIVERED", "FAILED", "RETURNED_TO_SHOP"] }, updatedAt: { gte: since } },
    include: { order: { select: { number: true, customer: { select: { name: true } }, shop: { select: { name: true } } } }, dropoffAddress: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const byDay = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = (r.deliveredAt ?? r.updatedAt).toLocaleDateString("mn-MN");
    byDay.set(k, [...(byDay.get(k) ?? []), r]);
  }
  return (
    <>
      <h2 className="section-title">Сүүлийн 30 хоног</h2>
      {rows.length === 0 ? (
        <div className="empty">Түүх хоосон байна.</div>
      ) : (
        [...byDay.entries()].map(([day, list]) => (
          <section key={day} className="hist-day">
            <div className="hist-day-head">
              <strong>{day}</strong>
              <span className="muted small-text">
                {list.filter((r) => r.status === "DELIVERED").length} хүргэсэн · {formatMNT(list.reduce((s, r) => s + r.codCollected, 0))}
              </span>
            </div>
            <ul className="list">
              {list.map((r) => (
                <li key={r.id} className="list-row">
                  <span className="list-row-body">
                    <strong>
                      #{r.order.number} · {r.order.customer.name}
                    </strong>
                    <span className="muted small-text">
                      {r.order.shop.name} · {formatAddress(r.dropoffAddress)}
                    </span>
                    {r.failReason && <span className="small-text form-error">{r.failReason}</span>}
                  </span>
                  <span className={`hist-status d-${r.status}`}>
                    {deliveryStatusLabel[r.status]}
                    {r.status === "DELIVERED" && <div className="small-text">{formatMNT(r.codCollected)}</div>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
