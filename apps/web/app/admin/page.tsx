import Link from "next/link";
import { prisma, type DeliveryStatus } from "@sankhuu/db";
import { requireAdmin } from "@/lib/roles";
import { deliveryStatusLabel, formatMNT, orderStatusLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatAddress, mapsUrl } from "@/lib/delivery";
import { AssignForm } from "./assign-form";

export const dynamic = "force-dynamic";

const TABS: { key: string; label: string; statuses: DeliveryStatus[] }[] = [
  { key: "pending", label: "Хүлээгдэж буй", statuses: ["PENDING"] },
  { key: "active", label: "Оноосон / Замд", statuses: ["ASSIGNED", "PICKED_UP"] },
  { key: "failed", label: "Амжилтгүй", statuses: ["FAILED"] },
  { key: "done", label: "Дууссан", statuses: ["DELIVERED", "RETURNED_TO_SHOP", "CANCELLED"] },
];

// Диспетчерийн самбар: хүргэлтүүдийг статусаар нь харж, жолоочид онооно
export default async function AdminDeliveriesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab } = await searchParams;
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const [deliveries, counts, drivers] = await Promise.all([
    prisma.delivery.findMany({
      where: { status: { in: current.statuses }, ...(current.key === "done" ? { updatedAt: { gte: weekAgo } } : {}) },
      include: {
        order: { include: { customer: true, shop: { select: { name: true, phone: true } }, items: { select: { name: true, quantity: true } } } },
        pickupAddress: true,
        dropoffAddress: true,
        driver: { include: { user: { select: { name: true, username: true, phone: true } } } },
      },
      orderBy: [{ createdAt: "asc" }],
      take: 200,
    }),
    prisma.delivery.groupBy({ by: ["status"], _count: true }),
    prisma.driver.findMany({
      where: { user: { isActive: true } },
      include: { user: { select: { name: true, username: true } }, _count: { select: { deliveries: { where: { status: { in: ["ASSIGNED", "PICKED_UP"] } } } } } },
      orderBy: [{ isOnline: "desc" }, { createdAt: "asc" }],
    }),
  ]);
  const countFor = (statuses: DeliveryStatus[]) => counts.filter((c) => statuses.includes(c.status)).reduce((s, c) => s + c._count, 0);
  const driverOpts = drivers.map((d) => ({ id: d.id, label: d.user.name ?? d.user.username ?? "Жолооч", online: d.isOnline, load: d._count.deliveries }));

  return (
    <>
      <div className="page-head">
        <h1>Хүргэлт</h1>
        <Link href="/admin/drivers" className="btn">
          Жолооч: {drivers.length} ({drivers.filter((d) => d.isOnline).length} онлайн)
        </Link>
      </div>
      <div className="toolbar">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin?tab=${t.key}`} className={`chip${current.key === t.key ? " on" : ""}`}>
            {t.label}
            {t.key !== "done" ? ` · ${countFor(t.statuses)}` : ""}
          </Link>
        ))}
      </div>

      {drivers.length === 0 && (
        <p className="notice">
          Жолооч бүртгэгдээгүй байна. <Link href="/admin/drivers">Жолооч нэмэх →</Link>
        </p>
      )}

      {deliveries.length === 0 ? (
        <div className="empty">Энэ хэсэгт хүргэлт алга.</div>
      ) : (
        <ul className="order-list">
          {deliveries.map((d) => (
            <li key={d.id} className="order-card delivery-card">
              <div className="order-head">
                <strong>#{d.order.number}</strong>
                <span className={`status d-${d.status}`}>{deliveryStatusLabel[d.status]}</span>
                <span className={`status s-${d.order.status}`}>{orderStatusLabel[d.order.status]}</span>
                <span className="muted small-text">{d.createdAt.toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" })}</span>
                {d.driver && (
                  <span className="muted small-text">
                    Жолооч: <strong>{d.driver.user.name ?? d.driver.user.username}</strong>
                    {d.driver.user.phone ? ` · ${formatPhone(d.driver.user.phone)}` : ""}
                  </span>
                )}
              </div>
              <div className="delivery-cols">
                <div>
                  <div className="label">Авах: {d.order.shop.name}</div>
                  <div>
                    <a href={mapsUrl(d.pickupAddress)} target="_blank" rel="noreferrer">
                      {formatAddress(d.pickupAddress)}
                    </a>
                  </div>
                  <div className="small-text">
                    <a href={`tel:${d.order.shop.phone}`}>{formatPhone(d.order.shop.phone)}</a>
                  </div>
                </div>
                <div>
                  <div className="label">Хүргэх: {d.order.customer.name}</div>
                  <div>
                    <a href={mapsUrl(d.dropoffAddress)} target="_blank" rel="noreferrer">
                      {formatAddress(d.dropoffAddress)}
                    </a>
                  </div>
                  <div className="small-text">
                    <a href={`tel:${d.order.customer.phone}`}>{formatPhone(d.order.customer.phone)}</a>
                  </div>
                </div>
                <div>
                  <div className="label">Бараа</div>
                  <div className="small-text">{d.order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</div>
                  <div>
                    Цуглуулах <strong>{formatMNT(d.codAmount)}</strong> · хөлс {formatMNT(d.fee)}
                  </div>
                  {d.order.note && <div className="small-text">Тайлбар: {d.order.note}</div>}
                  {d.failReason && <div className="small-text form-error">Шалтгаан: {d.failReason}</div>}
                </div>
              </div>
              <AssignForm deliveryId={d.id} status={d.status} currentDriverId={d.driverId} drivers={driverOpts} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
