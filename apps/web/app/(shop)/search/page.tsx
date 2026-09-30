import Link from "next/link";
import { prisma, type Prisma } from "@sankhuu/db";
import { ProductCard } from "../_components/product-card";
import { ALL_CATEGORIES, categoryStyle, publicProductWhere, soldCounts } from "../_components/catalog";
import { SearchBox } from "./search-box";

export const metadata = { title: "Хайх · Sankhuu" };

type Params = { q?: string; sale?: string; new?: string; hot?: string; sort?: string };

// Coupang-ийн эрэмбэ (쿠팡 랭킹순 · 낮은가격순 · 높은가격순 · 최신순)
const SORTS = [
  { key: "rank", label: "Эрэлттэй" },
  { key: "new", label: "Шинэ" },
  { key: "cheap", label: "Хямд нь эхэнд" },
  { key: "pricey", label: "Үнэтэй нь эхэнд" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const mode = sp.sale ? "sale" : sp.new ? "new" : sp.hot ? "hot" : null;
  const sort: SortKey = (SORTS.find((s) => s.key === sp.sort)?.key ?? (mode === "new" ? "new" : "rank")) as SortKey;
  const title = mode === "sale" ? "Хямдралтай бараа" : mode === "new" ? "Шинэ бараа" : mode === "hot" ? "Эрэлттэй бараа" : null;

  const where: Prisma.ProductWhereInput = {
    ...publicProductWhere,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { shop: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    ...(mode === "sale" ? { compareAtPrice: { not: null } } : {}),
    ...(mode ? { stock: { gt: 0 } } : {}),
  };
  const run = Boolean(q || mode);
  let products = run
    ? await prisma.product.findMany({ where, include: { shop: { select: { slug: true, name: true } } }, orderBy: [{ stock: "desc" }, { createdAt: "desc" }], take: 100 })
    : [];
  if (mode === "sale") products = products.filter((p) => (p.compareAtPrice ?? 0) > p.price);
  const sold = await soldCounts(products.map((p) => p.id));
  if (mode === "hot") products = products.filter((p) => (sold.get(p.id) ?? 0) > 0);
  const inStock = (p: { stock: number }) => (p.stock > 0 ? 0 : 1);
  products.sort((a, b) => {
    if (inStock(a) !== inStock(b)) return inStock(a) - inStock(b);
    if (sort === "cheap") return a.price - b.price;
    if (sort === "pricey") return b.price - a.price;
    if (sort === "new") return b.createdAt.getTime() - a.createdAt.getTime();
    return (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0) || b.ratingCount - a.ratingCount || b.createdAt.getTime() - a.createdAt.getTime();
  });

  const base = new URLSearchParams();
  if (q) base.set("q", q);
  if (mode) base.set(mode, "1");
  const sortHref = (k: SortKey) => {
    const u = new URLSearchParams(base);
    if (k !== "rank") u.set("sort", k);
    return `/search?${u.toString()}`;
  };

  return (
    <>
      <SearchBox initial={q} />
      {!run && (
        <section className="recent">
          <div className="recent-head">
            <span>Ангиллаар хайх</span>
          </div>
          <div className="chips">
            {ALL_CATEGORIES.map((c) => (
              <Link key={c} href={`/categories/${encodeURIComponent(c)}`} className="chip">
                {categoryStyle(c).icon} {c}
              </Link>
            ))}
          </div>
        </section>
      )}
      {run && (
        <>
          <p className="result-count">
            {title ? <strong>{title}</strong> : <>«{q}»</>} · {products.length} бараа
          </p>
          {products.length > 1 && (
            <nav className="chips scroll sort" aria-label="Эрэмбэлэх">
              {SORTS.map((s) => (
                <Link key={s.key} href={sortHref(s.key)} className={`chip${sort === s.key ? " on" : ""}`}>
                  {s.label}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
      {run && products.length === 0 && <div className="empty">Тохирох бараа олдсонгүй. Өөр үгээр хайж үзээрэй.</div>}
      {products.length > 0 && (
        <div className="pgrid pad">
          {products.map((p) => (
            <ProductCard key={p.id} p={{ ...p, sold: sold.get(p.id) }} />
          ))}
        </div>
      )}
    </>
  );
}
