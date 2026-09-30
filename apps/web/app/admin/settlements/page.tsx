import { prisma } from "@sankhuu/db";
import { requireAdmin } from "@/lib/roles";
import { formatMNT, settlementStatusLabel } from "@/lib/labels";
import { createSettlement, markSettlementPaid } from "../actions";

export const dynamic = "force-dynamic";

// Худалдагчийн тооцоо: цуглуулсан COD − хүргэлтийн хөлс = шилжүүлэх дүн
export default async function SettlementsPage() {
  await requireAdmin();
  const [unsettled, settlements] = await Promise.all([
    prisma.delivery.findMany({
      where: { status: "DELIVERED", settlementId: null },
      select: { codCollected: true, fee: true, order: { select: { shopId: true, shop: { select: { name: true, phone: true } } } } },
    }),
    prisma.settlement.findMany({ include: { shop: { select: { name: true } }, _count: { select: { deliveries: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const byShop = new Map<string, { name: string; count: number; cod: number; fee: number }>();
  for (const d of unsettled) {
    const g = byShop.get(d.order.shopId) ?? { name: d.order.shop.name, count: 0, cod: 0, fee: 0 };
    g.count++;
    g.cod += d.codCollected;
    g.fee += d.fee;
    byShop.set(d.order.shopId, g);
  }

  return (
    <>
      <h1>Худалдагчийн тооцоо</h1>
      <p className="muted">Хүргэгдсэн захиалга бүрээр: жолоочийн цуглуулсан дүнгээс хүргэлтийн хөлсийг хасаад худалдагчид шилжүүлнэ.</p>
      {byShop.size === 0 ? (
        <div className="empty">Тооцоо хийгээгүй хүргэлт алга.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Дэлгүүр</th>
              <th>Хүргэлт</th>
              <th>Цуглуулсан</th>
              <th>Хөлс</th>
              <th>Шилжүүлэх</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[...byShop.entries()].map(([shopId, g]) => (
              <tr key={shopId}>
                <td>
                  <strong>{g.name}</strong>
                </td>
                <td>{g.count}</td>
                <td>{formatMNT(g.cod)}</td>
                <td>{formatMNT(g.fee)}</td>
                <td>
                  <strong className={g.cod - g.fee < 0 ? "form-error" : ""}>{formatMNT(g.cod - g.fee)}</strong>
                  {g.cod - g.fee < 0 && <div className="small-text muted">Дэлгүүрээс авах</div>}
                </td>
                <td className="row-actions">
                  <form action={createSettlement.bind(null, shopId)}>
                    <button type="submit" className="btn primary">
                      Тооцоо үүсгэх
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Тооцооны түүх</h2>
      {settlements.length === 0 ? (
        <div className="empty">Одоогоор тооцоо алга.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Огноо</th>
              <th>Дэлгүүр</th>
              <th>Хугацаа</th>
              <th>Хүргэлт</th>
              <th>Шилжүүлэх</th>
              <th>Төлөв</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id}>
                <td>{s.createdAt.toLocaleDateString("mn-MN")}</td>
                <td>{s.shop.name}</td>
                <td className="small-text">
                  {s.periodStart.toLocaleDateString("mn-MN")} – {s.periodEnd.toLocaleDateString("mn-MN")}
                </td>
                <td>{s._count.deliveries}</td>
                <td>
                  <strong>{formatMNT(s.payout)}</strong>
                  <div className="small-text muted">
                    {formatMNT(s.codTotal)} − {formatMNT(s.feeTotal)}
                  </div>
                </td>
                <td>
                  <span className={`status ${s.status === "PAID" ? "s-DELIVERED" : "s-CONFIRMED"}`}>{settlementStatusLabel[s.status]}</span>
                  {s.paidAt && <div className="small-text muted">{s.paidAt.toLocaleDateString("mn-MN")}</div>}
                </td>
                <td className="row-actions">
                  {s.status === "PENDING" && (
                    <form action={markSettlementPaid.bind(null, s.id)}>
                      <button type="submit" className="btn">
                        Төлсөн
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
