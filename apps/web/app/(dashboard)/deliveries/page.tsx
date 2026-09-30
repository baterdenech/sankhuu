import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { deliveryStatusLabel, formatMNT, settlementStatusLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatAddress } from "@/lib/delivery";

export const dynamic = "force-dynamic";

// Худалдагч: өөрийн захиалгуудын хүргэлтийн явц, жолооч, тооцоо
export default async function DeliveriesPage() {
  const { shop } = await requireShop();
  const [deliveries, settlements, unsettled] = await Promise.all([
    prisma.delivery.findMany({
      where: { order: { shopId: shop.id } },
      include: { order: { select: { number: true, customer: { select: { name: true, phone: true } } } }, dropoffAddress: true, driver: { include: { user: { select: { name: true, username: true, phone: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.settlement.findMany({ where: { shopId: shop.id }, include: { _count: { select: { deliveries: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.delivery.aggregate({ _sum: { codCollected: true, fee: true }, _count: true, where: { status: "DELIVERED", settlementId: null, order: { shopId: shop.id } } }),
  ]);
  const counts = (s: (typeof deliveries)[number]["status"][]) => deliveries.filter((d) => s.includes(d.status)).length;
  const pendingPayout = (unsettled._sum.codCollected ?? 0) - (unsettled._sum.fee ?? 0);

  return (
    <>
      <h1>Хүргэлт</h1>
      <div className="cards" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="label">Жолооч хүлээж буй</div>
          <div className="value">{counts(["PENDING"])}</div>
        </div>
        <div className="card">
          <div className="label">Замд</div>
          <div className="value">{counts(["ASSIGNED", "PICKED_UP"])}</div>
        </div>
        <div className="card">
          <div className="label">Тооцоо хүлээж буй</div>
          <div className="value">{formatMNT(pendingPayout)}</div>
          <div className="small-text muted">{unsettled._count} хүргэлт</div>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <div className="empty">Захиалга орж ирэхэд хүргэлт нь энд харагдана. Sankhuu-гийн диспетчер жолооч онооно.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Захиалга</th>
              <th>Худалдан авагч</th>
              <th>Төлөв</th>
              <th>Жолооч</th>
              <th>Цуглуулсан</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>#{d.order.number}</strong>
                  <div className="small-text muted">{d.createdAt.toLocaleDateString("mn-MN")}</div>
                </td>
                <td>
                  {d.order.customer.name}
                  <div className="small-text muted">{formatAddress(d.dropoffAddress)}</div>
                </td>
                <td>
                  <span className={`status d-${d.status}`}>{deliveryStatusLabel[d.status]}</span>
                  {d.failReason && <div className="small-text form-error">{d.failReason}</div>}
                </td>
                <td>
                  {d.driver ? (
                    <>
                      {d.driver.user.name ?? d.driver.user.username}
                      {d.driver.user.phone && (
                        <div className="small-text">
                          <a href={`tel:${d.driver.user.phone}`}>{formatPhone(d.driver.user.phone)}</a>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{d.status === "DELIVERED" ? formatMNT(d.codCollected) : <span className="muted">{formatMNT(d.codAmount)}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Тооцоо</h2>
      <p className="muted small-text">Хүргэгдсэн захиалга бүрээр жолоочийн цуглуулсан дүнгээс хүргэлтийн хөлсийг хасаад Sankhuu танд шилжүүлнэ.</p>
      {settlements.length === 0 ? (
        <div className="empty">Одоогоор тооцоо алга.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Огноо</th>
              <th>Хугацаа</th>
              <th>Хүргэлт</th>
              <th>Цуглуулсан</th>
              <th>Хөлс</th>
              <th>Шилжүүлэх</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id}>
                <td>{s.createdAt.toLocaleDateString("mn-MN")}</td>
                <td className="small-text">
                  {s.periodStart.toLocaleDateString("mn-MN")} – {s.periodEnd.toLocaleDateString("mn-MN")}
                </td>
                <td>{s._count.deliveries}</td>
                <td>{formatMNT(s.codTotal)}</td>
                <td>{formatMNT(s.feeTotal)}</td>
                <td>
                  <strong>{formatMNT(s.payout)}</strong>
                </td>
                <td>
                  <span className={`status ${s.status === "PAID" ? "s-DELIVERED" : "s-CONFIRMED"}`}>{settlementStatusLabel[s.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
