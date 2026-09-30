import { prisma } from "@sankhuu/db";
import { requireAdmin } from "@/lib/roles";
import { formatMNT } from "@/lib/labels";
import { receiveCash } from "../actions";

export const dynamic = "force-dynamic";

// Жолооч бүрийн гар дээрх бэлэн мөнгө (хүргэсэн, тушаагаагүй) ба тушаалтын түүх
export default async function CashPage() {
  await requireAdmin();
  const [drivers, handovers] = await Promise.all([
    prisma.driver.findMany({
      include: { user: { select: { name: true, username: true } }, deliveries: { where: { status: "DELIVERED", cashHandoverId: null }, select: { codCollected: true, order: { select: { number: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cashHandover.findMany({ include: { driver: { include: { user: { select: { name: true, username: true } } } }, _count: { select: { deliveries: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const outstanding = drivers.filter((d) => d.deliveries.length > 0);
  const total = outstanding.reduce((s, d) => s + d.deliveries.reduce((a, x) => a + x.codCollected, 0), 0);

  return (
    <>
      <div className="page-head">
        <h1>Бэлэн мөнгө</h1>
        <div className="card compact">
          <div className="label">Жолоочдын гар дээр нийт</div>
          <div className="value">{formatMNT(total)}</div>
        </div>
      </div>
      {outstanding.length === 0 ? (
        <div className="empty">Тушаагаагүй бэлэн мөнгө алга.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Жолооч</th>
              <th>Хүргэлт</th>
              <th>Дүн</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {outstanding.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.user.name ?? d.user.username}</strong>
                </td>
                <td className="small-text">{d.deliveries.map((x) => `#${x.order.number}`).join(", ")}</td>
                <td>
                  <strong>{formatMNT(d.deliveries.reduce((s, x) => s + x.codCollected, 0))}</strong>
                </td>
                <td className="row-actions">
                  <form action={receiveCash.bind(null, d.id)}>
                    <button type="submit" className="btn primary">
                      Хүлээн авлаа
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Тушаалтын түүх</h2>
      {handovers.length === 0 ? (
        <div className="empty">Одоогоор тушаалт алга.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Огноо</th>
              <th>Жолооч</th>
              <th>Хүргэлт</th>
              <th>Дүн</th>
            </tr>
          </thead>
          <tbody>
            {handovers.map((h) => (
              <tr key={h.id}>
                <td>{h.createdAt.toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" })}</td>
                <td>{h.driver.user.name ?? h.driver.user.username}</td>
                <td>{h._count.deliveries}</td>
                <td>{formatMNT(h.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
