import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@sankhuu/db";
import { formatMNT } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Sankhuu · Онлайн худалдаа, хүргэлт",
  description: "Дэлгүүрүүдийн барааг нэг дороос хайж, захиалаад хаалган дээрээ хүргүүлээрэй.",
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string; c?: string }> }) {
  const { q, c } = await searchParams;
  const where = {
    isActive: true,
    stock: { gt: 0 },
    shop: { isActive: true },
    ...(c ? { category: c } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {}),
  };

  const [products, categories, shops] = await Promise.all([
    prisma.product.findMany({ where, include: { shop: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.product.groupBy({ by: ["category"], where: { isActive: true, stock: { gt: 0 }, category: { not: null }, shop: { isActive: true } }, _count: true, orderBy: { _count: { category: "desc" } } }),
    prisma.shop.findMany({
      where: { isActive: true, products: { some: { isActive: true } } },
      select: { name: true, slug: true, logoUrl: true, _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  const filtering = Boolean(q || c);

  return (
    <div className="sf">
      <header className="sf-header">
        <Link href="/" className="sf-brand">
          <span className="sf-avatar">S</span>
          <span>Sankhuu</span>
        </Link>
        <div className="sf-header-actions">
          <Link href="/login" className="sf-icon-link">
            Худалдагч уу? Нэвтрэх
          </Link>
        </div>
      </header>

      <main className="sf-main">
        {!filtering && (
          <section className="hero">
            <h1>Хүссэн бараагаа нэг дороос</h1>
            <p>Хайгаад, захиалаад, хаалган дээрээ хүлээж аваарай. Төлбөрийг хүргэлтээр төлнө.</p>
          </section>
        )}

        <form action="/" className="home-search" role="search">
          <input type="search" name="q" defaultValue={q ?? ""} placeholder="Бараа хайх… (жишээ: даашинз, цүнх)" aria-label="Бараа хайх" />
          {c && <input type="hidden" name="c" value={c} />}
          <button type="submit" className="btn primary">
            Хайх
          </button>
        </form>

        {categories.length > 0 && (
          <nav className="sf-chips" aria-label="Ангилал">
            <Link href={q ? `/?q=${encodeURIComponent(q)}` : "/"} className={`chip${!c ? " on" : ""}`}>
              Бүгд
            </Link>
            {categories.map((g) => (
              <Link key={g.category} href={`/?c=${encodeURIComponent(g.category!)}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`chip${c === g.category ? " on" : ""}`}>
                {g.category} <span className="muted">{g._count}</span>
              </Link>
            ))}
          </nav>
        )}

        {products.length === 0 ? (
          <div className="empty">
            {filtering ? (
              <>
                <p>Тохирох бараа олдсонгүй.</p>
                <Link href="/" className="btn">
                  Бүх барааг үзэх
                </Link>
              </>
            ) : (
              <>
                <p>Одоогоор бараа байхгүй байна. Дэлгүүрүүд бараагаа нэмж эхлэхээр энд харагдана.</p>
                <Link href="/login/register" className="btn primary">
                  Дэлгүүрээ нээх
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <h2 className="section-title">{filtering ? `${products.length} бараа` : "Шинэ бараанууд"}</h2>
            <ul className="sf-grid">
              {products.map((p) => (
                <li key={p.id}>
                  <Link href={`/s/${p.shop.slug}/p/${p.id}`} className="sf-product">
                    <div className="sf-media">
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.name} loading="lazy" />
                      ) : (
                        <span className="no-image">Зураггүй</span>
                      )}
                    </div>
                    <div className="sf-product-name">{p.name}</div>
                    <div className="sf-product-price">{formatMNT(p.price)}</div>
                    <div className="sf-product-shop">{p.shop.name}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {!filtering && shops.length > 0 && (
          <section className="shops">
            <h2 className="section-title">Дэлгүүрүүд</h2>
            <ul className="shop-list">
              {shops.map((s) => (
                <li key={s.slug}>
                  <Link href={`/s/${s.slug}`} className="shop-card">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt="" />
                    ) : (
                      <span className="sf-avatar">{s.name.slice(0, 1)}</span>
                    )}
                    <span className="shop-card-body">
                      <strong>{s.name}</strong>
                      <span className="muted small-text">{s._count.products} бараа</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="seller-cta">
          <h2>Бараа зардаг уу?</h2>
          <p>Дэлгүүрээ Sankhuu дээр нээгээд бараагаа зургаар бүртгэ, захиалгаа нэг дороос удирд, хүргэлтийг бид хийе.</p>
          <Link href="/login/register" className="btn primary big">
            Дэлгүүрээ үнэгүй нээх
          </Link>
        </section>
      </main>

      <footer className="sf-footer">
        <span>
          <strong>Sankhuu</strong> · захиалга, хүргэлтийн систем
        </span>
      </footer>
    </div>
  );
}
