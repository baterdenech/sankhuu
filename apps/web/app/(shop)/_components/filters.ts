// ─── Хайлт, ангиллын шүүлтүүр: URL параметр ↔ шүүлт, эрэмбэ (сервер, клиент хоёуланд ашиглана) ───

export const SORTS = [
  { key: "rank", label: "Эрэлттэй" },
  { key: "new", label: "Шинэ" },
  { key: "cheap", label: "Хямд нь эхэнд" },
  { key: "pricey", label: "Үнэтэй нь эхэнд" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

export type Filters = {
  cat: string | null; // ангилал (хайлтын хуудсанд)
  min: number | null; // үнэ ₮
  max: number | null;
  shop: string | null; // дэлгүүрийн slug
  rating: number | null; // дундаж од ≥ (3 | 4)
  stock: boolean; // зөвхөн бэлэн байгаа
  sale: boolean; // зөвхөн хямдралтай
  sort: SortKey;
};

export const PRICE_PRESETS: {
  label: string;
  min: number | null;
  max: number | null;
}[] = [
  { label: "20 мянга хүртэл", min: null, max: 20000 },
  { label: "20 – 50 мянга", min: 20000, max: 50000 },
  { label: "50 – 100 мянга", min: 50000, max: 100000 },
  { label: "100 – 300 мянга", min: 100000, max: 300000 },
  { label: "300 мянгаас дээш", min: 300000, max: null },
];

const int = (v: string | undefined) => {
  if (!v) return null;
  const n = Math.trunc(Number(String(v).replace(/[^\d]/g, "")));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function parseFilters(
  sp: Record<string, string | undefined>,
  defaultSort: SortKey = "rank",
): Filters {
  const rating = int(sp.rating);
  return {
    cat: sp.cat?.trim() || null,
    min: int(sp.min),
    max: int(sp.max),
    shop: sp.shop?.trim() || null,
    rating: rating === 3 || rating === 4 ? rating : null,
    stock: sp.stock === "1",
    sale: sp.sale === "1",
    sort: SORTS.find((s) => s.key === sp.sort)?.key ?? defaultSort,
  };
}

export const activeCount = (f: Filters) =>
  [f.cat, f.min, f.max, f.shop, f.rating].filter((x) => x !== null).length +
  (f.stock ? 1 : 0) +
  (f.sale ? 1 : 0);

// Хуудасны суурь параметр (q, ангилал, горим) + шүүлтүүр → query string. Анхдагч утгыг бичихгүй.
export function toQuery(
  base: Record<string, string>,
  f: Partial<Filters>,
  defaultSort: SortKey = "rank",
) {
  const u = new URLSearchParams(base);
  if (f.cat) u.set("cat", f.cat);
  if (f.min) u.set("min", String(f.min));
  if (f.max) u.set("max", String(f.max));
  if (f.shop) u.set("shop", f.shop);
  if (f.rating) u.set("rating", String(f.rating));
  if (f.stock) u.set("stock", "1");
  if (f.sale) u.set("sale", "1");
  if (f.sort && f.sort !== defaultSort) u.set("sort", f.sort);
  const s = u.toString();
  return s ? `?${s}` : "";
}

export type Filterable = {
  id: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  category?: string | null;
  ratingCount?: number;
  ratingSum?: number;
  createdAt?: Date;
  shop: { slug: string; name: string };
};

export const isOnSale = (p: {
  price: number;
  compareAtPrice?: number | null;
}) => Boolean(p.compareAtPrice && p.compareAtPrice > p.price);

export function applyFilters<T extends Filterable>(
  products: T[],
  f: Filters,
): T[] {
  return products.filter((p) => {
    if (f.cat && p.category !== f.cat) return false;
    if (f.min !== null && p.price < f.min) return false;
    if (f.max !== null && p.price > f.max) return false;
    if (f.shop && p.shop.slug !== f.shop) return false;
    if (f.stock && p.stock <= 0) return false;
    if (f.sale && !isOnSale(p)) return false;
    if (
      f.rating !== null &&
      (!p.ratingCount || (p.ratingSum ?? 0) / p.ratingCount < f.rating)
    )
      return false;
    return true;
  });
}

// Бэлэн байгаа нь эхэнд, дараа нь сонгосон эрэмбэ
export function sortProducts<T extends Filterable>(
  products: T[],
  sort: SortKey,
  sold: Map<string, number>,
): T[] {
  const inStock = (p: { stock: number }) => (p.stock > 0 ? 0 : 1);
  const t = (p: T) => p.createdAt?.getTime() ?? 0;
  return [...products].sort((a, b) => {
    if (inStock(a) !== inStock(b)) return inStock(a) - inStock(b);
    if (sort === "cheap") return a.price - b.price;
    if (sort === "pricey") return b.price - a.price;
    if (sort === "new") return t(b) - t(a);
    return (
      (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0) ||
      (b.ratingCount ?? 0) - (a.ratingCount ?? 0) ||
      t(b) - t(a)
    );
  });
}

export type Facets = {
  shops: { slug: string; name: string; count: number }[];
  categories: { name: string; count: number }[];
};

// Шүүлтүүр хэрэглэхээс өмнөх багцаас дэлгүүр, ангиллын тоог гаргана (сонголтын жагсаалтад)
export function buildFacets(products: Filterable[]): Facets {
  const shops = new Map<
    string,
    { slug: string; name: string; count: number }
  >();
  const cats = new Map<string, number>();
  for (const p of products) {
    const s = shops.get(p.shop.slug) ?? {
      slug: p.shop.slug,
      name: p.shop.name,
      count: 0,
    };
    s.count++;
    shops.set(p.shop.slug, s);
    if (p.category) cats.set(p.category, (cats.get(p.category) ?? 0) + 1);
  }
  return {
    shops: [...shops.values()].sort((a, b) => b.count - a.count),
    categories: [...cats.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}
