import Link from "next/link";
import { prisma } from "@sankhuu/db";
import { TopBar } from "../_components/top-bar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Дэлгүүрүүд · Sankhuu" };

export default async function ShopsPage() {
  const shops = await prisma.shop.findMany({
    where: { isActive: true, products: { some: { isActive: true } } },
    select: { name: true, slug: true, logoUrl: true, pickupAddress: { select: { district: true } }, _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <TopBar title="Дэлгүүрүүд" backHref="/" />
      {shops.length === 0 ? (
        <div className="empty">Одоогоор дэлгүүр байхгүй байна.</div>
      ) : (
        <ul className="list">
          {shops.map((s, i) => (
            <li key={s.slug}>
              <Link href={`/s/${s.slug}`} className="list-row">
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt="" className="shop-logo sm" />
                ) : (
                  <span className={`shop-logo sm letter tone-${i % 5}`}>{s.name.slice(0, 1)}</span>
                )}
                <span className="list-row-body">
                  <strong>{s.name}</strong>
                  <span className="muted small-text">
                    {s._count.products} бараа{s.pickupAddress ? ` · ${s.pickupAddress.district}` : ""}
                  </span>
                </span>
                <span className="chev">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
