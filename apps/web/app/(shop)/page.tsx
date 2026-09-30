import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@sankhuu/db";
import { CartIcon, SearchIcon } from "./_components/icons";
import { CategoryIcon, FlameIcon, ParcelIcon, SparkleIcon, StoreFrontIcon, TagIcon } from "./_components/catalog-icons";
import { ProductCard } from "./_components/product-card";
import { BannerCarousel, type Banner } from "./_components/banner-carousel";
import { CartBadge } from "./_components/cart-badge";
import { Countdown } from "./_components/countdown";
import { AskBar } from "./_components/ask-bar";
import { ALL_CATEGORIES, categoryStyle, publicProductWhere, soldCounts } from "./_components/catalog";

// Бараа DB-ээс ирдэг тул хүсэлт бүрт render хийнэ (build үед урьдчилж үүсгэхгүй)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sankhuu · Онлайн худалдаа, хүргэлт",
  description: "Дэлгүүрүүдийн барааг нэг дороос хайж, захиалаад хаалган дээрээ хүргүүлээрэй.",
};

const QUICK = [
  { label: "Хямдрал", Icon: TagIcon, href: "/search?q=&sale=1", cls: "q1" },
  { label: "Шинэ", Icon: SparkleIcon, href: "/search?q=&new=1", cls: "q2" },
  { label: "Эрэлттэй", Icon: FlameIcon, href: "/search?q=&hot=1", cls: "q3" },
  { label: "Дэлгүүрүүд", Icon: StoreFrontIcon, href: "/shops", cls: "q4" },
  { label: "Захиалга", Icon: ParcelIcon, href: "/me", cls: "q5" },
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
  const topDeal = [...deals].sort((a, b) => b.compareAtPrice! / b.price - a.compareAtPrice! / a.price)[0];
  const hero = popular[0] ?? products[0];

  const banners: Banner[] = [
    { tag: "Хүргэлт", title: "Хаалган дээр хүргэнэ", text: "Улаанбаатар хотод 5,000₮-с · 15:00-с өмнө захиалбал маргааш", cls: "b1", image: hero?.images[0] },
    ...(topDeal
      ? [{ tag: `${Math.round((1 - topDeal.price / topDeal.compareAtPrice!) * 100)}% хямдрал`, title: topDeal.name, text: `${topDeal.price.toLocaleString("en-US")}₮ · ${topDeal.shop.name}`, cls: "b3", image: topDeal.images[0], href: `/s/${topDeal.shop.slug}/p/${topDeal.id}` }]
      : []),
    { tag: "Төлбөр", title: "Үзээд, дараа нь төл", text: "Төлбөрийг бараагаа хүлээж авахдаа жолоочид", cls: "b2" },
    { tag: "Худалдагчид", title: "Дэлгүүрээ үнэгүй нээ", text: "Зургаа оруулахад AI нэр, тайлбарыг нь бичнэ", cls: "b4", href: "/login/register" },
  ];

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
          <SearchIcon size={20} className="search-box-icon" />
          <span>Хайх бараагаа бичнэ үү</span>
        </Link>
      </header>

      <nav className="quick" aria-label="Түргэн цэс">
        {QUICK.map((q) => (
          <Link key={q.label} href={q.href} className="quick-item">
            <span className={`quick-icon ${q.cls}`}>
              <q.Icon size={24} />
            </span>
            <span>{q.label}</span>
          </Link>
        ))}
      </nav>

      <BannerCarousel banners={banners} />

      <AskBar />

      <section className="cat-grid" aria-label="Ангилал">
        {ALL_CATEGORIES.map((c) => (
          <Link key={c} href={`/categories/${encodeURIComponent(c)}`} className="cat-item">
            <span className="cat-icon" style={{ background: categoryStyle(c).background }}>
              <CategoryIcon name={c} size={26} />
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
