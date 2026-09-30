import { prisma, type Prisma } from "@sankhuu/db";
import { ProductCard } from "../_components/product-card";
import { publicProductWhere, soldCounts } from "../_components/catalog";
import { SearchBox } from "./search-box";

export const metadata = { title: "Хайх · Sankhuu" };

type Params = { q?: string; sale?: string; new?: string; hot?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const mode = sp.sale ? "sale" : sp.new ? "new" : sp.hot ? "hot" : null;
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
  if (mode === "hot") products = products.filter((p) => (sold.get(p.id) ?? 0) > 0).sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0));

  return (
    <>
      <SearchBox initial={q} />
      {run && (
        <p className="result-count">
          {title ? <strong>{title}</strong> : <>«{q}»</>} · {products.length} бараа
        </p>
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
