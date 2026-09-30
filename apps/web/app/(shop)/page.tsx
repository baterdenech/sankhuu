import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@sankhuu/db";
import { CartIcon, SearchIcon } from "./_components/icons";
import { ProductCard } from "./_components/product-card";
import { BannerCarousel } from "./_components/banner-carousel";
import { CartBadge } from "./_components/cart-badge";
import { Countdown } from "./_components/countdown";
import { ALL_CATEGORIES, categoryStyle, publicProductWhere, soldCounts } from "./_components/catalog";

// Бараа DB-ээс ирдэг тул хүсэлт бүрт render хийнэ (build үед урьдчилж үүсгэхгүй)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sankhuu · Онлайн худалдаа, хүргэлт",
  description: "Дэлгүүрүүдийн барааг нэг дороос хайж, захиалаад хаалган дээрээ хүргүүлээрэй.",
};

const BANNERS = [
  { title: "Хаалган дээр хүргэнэ", text: "Улаанбаатар хотод 5,000₮-с · 1-2 өдөрт", emoji: "🛵", cls: "b1" },
  { title: "Үзээд, дараа нь төл", text: "Төлбөрийг бараагаа хүлээж авахдаа", emoji: "💸", cls: "b2" },
  { title: "Дэлгүүрээ үнэгүй нээ", text: "Зургаа оруулахад AI бүртгэнэ", emoji: "✨", cls: "b3", href: "/login/register" },
];

const QUICK = [
  { label: "Хямдрал", emoji: "🏷️", href: "/search?q=&sale=1" },
  { label: "Шинэ", emoji: "🆕", href: "/search?q=&new=1" },
  { label: "Эрэлттэй", emoji: "🔥", href: "/search?q=&hot=1" },
  { label: "Дэлгүүрүүд", emoji: "🏬", href: "/shops" },
  { label: "Захиалга", emoji: "📦", href: "/me" },
];

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { ...publicProductWhere, stock: { gt: 0 } },
    include: { shop: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const sold = await soldCounts(products.map((p) => p.id));
  const deals = products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price).slice(0, 10);
  const popular = [...products].filter((p) => (sold.get(p.id) ?? 0) > 0).sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0)).slice(0, 10);

  return (
    <>
      <header className="home-top">
        <div className="home-brand">
          <Link href="/" className="logo">
            <span className="logo-mark">S</span>
            <span className="logo-text">Sankhuu</span>
          </Link>
          <Link href="/cart" className="home-cart" aria-label="Сагс">
            <CartIcon />
            <CartBadge />
          </Link>
        </div>
        <Link href="/search" className="search-box" aria-label="Бараа хайх">
          <span>Хайх бараагаа бичнэ үү</span>
          <SearchIcon size={22} className="search-box-icon" />
        </Link>
      </header>

      <nav className="quick" aria-label="Түргэн цэс">
        {QUICK.map((q) => (
          <Link key={q.label} href={q.href} className="quick-item">
            <span className="quick-icon">{q.emoji}</span>
            <span>{q.label}</span>
          </Link>
        ))}
      </nav>

      <BannerCarousel banners={BANNERS} />

      <section className="cat-grid" aria-label="Ангилал">
        {ALL_CATEGORIES.map((c) => (
          <Link key={c} href={`/categories/${encodeURIComponent(c)}`} className="cat-item">
            <span className="cat-icon" style={{ background: categoryStyle(c).background }}>
              {categoryStyle(c).icon}
            </span>
            <span className="cat-label">{c}</span>
          </Link>
        ))}
      </section>

      {deals.length > 0 && (
        <section className="feed">
          <div className="feed-head">
            <h2 className="feed-title">
              Өнөөдрийн хямдрал <Countdown />
            </h2>
            <Link href="/search?q=&sale=1" className="feed-more">
              Бүгд ›
            </Link>
          </div>
          <div className="hscroll">
            {deals.map((p) => (
              <div key={p.id} className="hscroll-item">
                <ProductCard p={{ ...p, sold: sold.get(p.id) }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="feed">
          <div className="feed-head">
            <h2 className="feed-title">Эрэлттэй бараа</h2>
            <Link href="/search?q=&hot=1" className="feed-more">
              Бүгд ›
            </Link>
          </div>
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
        <div className="feed-head">
          <h2 className="feed-title">Танд санал болгох</h2>
        </div>
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
          <span>Дэлгүүрээ үнэгүй нээгээд захиалгаа нэг дороос удирд, хүргэлтийг бид хийе.</span>
        </div>
        <Link href="/login/register" className="btn primary small">
          Дэлгүүр нээх
        </Link>
      </section>
    </>
  );
}
