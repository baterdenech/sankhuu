import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@sankhuu/db";
import { SearchIcon } from "./_components/icons";
import { ProductCard } from "./_components/product-card";
import { ALL_CATEGORIES, CATEGORY_ICONS, categoryCounts, publicProductWhere, soldCounts } from "./_components/catalog";

// Бараа DB-ээс ирдэг тул хүсэлт бүрт render хийнэ (build үед урьдчилж үүсгэхгүй)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sankhuu · Онлайн худалдаа, хүргэлт",
  description: "Дэлгүүрүүдийн барааг нэг дороос хайж, захиалаад хаалган дээрээ хүргүүлээрэй.",
};

const BANNERS = [
  { title: "Хаалган дээр хүргэнэ", text: "Улаанбаатар хотод 5,000₮-с", cls: "b1" },
  { title: "Төлбөрөө хүлээж аваад төлнө", text: "Бараагаа үзээд, дараа нь төлнө", cls: "b2" },
  { title: "Дэлгүүрээ үнэгүй нээ", text: "Зургаа оруулахад AI бүртгэнэ", cls: "b3", href: "/login/register" },
];

export default async function HomePage() {
  const [products, counts, shops] = await Promise.all([
    prisma.product.findMany({
      where: { ...publicProductWhere, stock: { gt: 0 } },
      include: { shop: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    categoryCounts(),
    prisma.shop.count({ where: { isActive: true, products: { some: { isActive: true } } } }),
  ]);
  const sold = await soldCounts(products.map((p) => p.id));
  const popular = [...products].sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0)).slice(0, 6).filter((p) => (sold.get(p.id) ?? 0) > 0);

  return (
    <>
      <header className="home-top">
        <Link href="/search" className="search-fake" aria-label="Бараа хайх">
          <SearchIcon size={20} />
          <span>Бараа, дэлгүүр хайх</span>
        </Link>
      </header>

      <section className="banners" aria-label="Мэдээлэл">
        {BANNERS.map((b) => {
          const inner = (
            <>
              <strong>{b.title}</strong>
              <span>{b.text}</span>
            </>
          );
          return b.href ? (
            <Link key={b.title} href={b.href} className={`banner ${b.cls}`}>
              {inner}
            </Link>
          ) : (
            <div key={b.title} className={`banner ${b.cls}`}>
              {inner}
            </div>
          );
        })}
      </section>

      <section className="cat-grid" aria-label="Ангилал">
        {ALL_CATEGORIES.map((c) => (
          <Link key={c} href={`/categories/${encodeURIComponent(c)}`} className="cat-item">
            <span className="cat-icon">{CATEGORY_ICONS[c]}</span>
            <span className="cat-label">{c}</span>
            {counts.get(c) ? <span className="cat-count">{counts.get(c)}</span> : null}
          </Link>
        ))}
      </section>

      {popular.length > 0 && (
        <section className="feed">
          <h2 className="feed-title">🔥 Эрэлттэй</h2>
          <div className="hscroll">
            {popular.map((p) => (
              <div key={p.id} className="hscroll-item">
                <ProductCard p={{ ...p, sold: sold.get(p.id) }} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="feed">
        <h2 className="feed-title">Шинэ бараанууд</h2>
        {products.length === 0 ? (
          <div className="empty">
            <p>Одоогоор бараа байхгүй байна. Эхний дэлгүүр болоорой.</p>
            <Link href="/login/register" className="btn primary">
              Дэлгүүрээ нээх
            </Link>
          </div>
        ) : (
          <div className="pgrid">
            {products.map((p) => (
              <ProductCard key={p.id} p={{ ...p, sold: sold.get(p.id) }} />
            ))}
          </div>
        )}
      </section>

      <section className="seller-strip">
        <div>
          <strong>Бараа зардаг уу?</strong>
          <span>{shops > 0 ? `${shops} дэлгүүр аль хэдийн нэгдсэн. ` : ""}Дэлгүүрээ үнэгүй нээгээд захиалгаа нэг дороос удирд.</span>
        </div>
        <Link href="/login/register" className="btn primary">
          Нээх
        </Link>
      </section>
    </>
  );
}
