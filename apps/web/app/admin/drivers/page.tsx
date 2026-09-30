import { prisma } from "@sankhuu/db";
import { requireAdmin } from "@/lib/roles";
import { formatMNT, vehicleTypeLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { DriverForm } from "./driver-form";
import { makeAdmin, setDriverActive } from "../actions";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  await requireAdmin();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const drivers = await prisma.driver.findMany({
    include: {
      user: true,
      _count: { select: { deliveries: { where: { status: { in: ["ASSIGNED", "PICKED_UP"] } } } } },
      deliveries: { where: { status: "DELIVERED", cashHandoverId: null }, select: { codCollected: true } },
    },
    orderBy: [{ isOnline: "desc" }, { createdAt: "asc" }],
  });
  const todayDone = await prisma.delivery.groupBy({ by: ["driverId"], _count: true, where: { status: "DELIVERED", deliveredAt: { gte: startOfDay } } });
  const doneFor = (id: string) => todayDone.find((t) => t.driverId === id)?._count ?? 0;
  const canCreate = Boolean(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <>
      <h1>Жолооч</h1>
      <div className="two-col">
        <section>
          {drivers.length === 0 ? (
            <div className="empty">Жолооч бүртгэгдээгүй байна.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Жолооч</th>
                  <th>Тээвэр</th>
                  <th>Төлөв</th>
                  <th>Замд</th>
                  <th>Өнөөдөр</th>
                  <th>Гар дээрх</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  const cash = d.deliveries.reduce((s, x) => s + x.codCollected, 0);
                  return (
                    <tr key={d.id} className={d.user.isActive ? "" : "off"}>
                      <td>
                        <strong>{d.user.name ?? d.user.username}</strong>
                        <div className="small-text muted">
                          {d.user.username ?? ""}
                          {d.user.phone ? ` · ${formatPhone(d.user.phone)}` : ""}
                        </div>
                      </td>
                      <td>
                        {vehicleTypeLabel[d.vehicleType]}
                        {d.plateNumber ? ` · ${d.plateNumber}` : ""}
                      </td>
                      <td>{!d.user.isActive ? "Идэвхгүй" : d.isOnline ? <span className="online">● Онлайн</span> : "Офлайн"}</td>
                      <td>{d._count.deliveries}</td>
                      <td>{doneFor(d.id)}</td>
                      <td>{formatMNT(cash)}</td>
                      <td className="row-actions">
                        <form action={setDriverActive.bind(null, d.id, !d.user.isActive)}>
                          <button type="submit" className="link-button">
                            {d.user.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                          </button>
                        </form>
                        {d.user.role !== "ADMIN" && (
                          <form action={makeAdmin.bind(null, d.userId)}>
                            <button type="submit" className="link-button">
                              Админ болгох
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="muted small-text">Жолооч утсан дээрээ erp.flexlink.mn/driver хуудсыг нээгээд нэвтэрнэ. "Нүүр дэлгэцэнд нэмэх" хийвэл апп шиг ажиллана.</p>
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Жолооч нэмэх</h2>
          <DriverForm canCreate={canCreate} />
        </section>
      </div>
    </>
  );
}
