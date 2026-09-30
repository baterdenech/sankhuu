import { prisma } from "@sankhuu/db";
import { ProductCard } from "../_components/product-card";
import { publicProductWhere, soldCounts } from "../_components/catalog";
import { SearchBox } from "./search-box";

export const metadata = { title: "Хайх · Sankhuu" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const products = q
    ? await prisma.product.findMany({
        where: {
          ...publicProductWhere,
          OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { shop: { name: { contains: q, mode: "insensitive" } } }],
        },
        include: { shop: { select: { slug: true, name: true } } },
        orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
        take: 100,
      })
    : [];
  const sold = await soldCounts(products.map((p) => p.id));

  return (
    <>
      <SearchBox initial={q} />
      {q && (
        <p className="result-count">
          «{q}» — {products.length} бараа
        </p>
      )}
      {q && products.length === 0 && <div className="empty">Тохирох бараа олдсонгүй. Өөр үгээр хайж үзээрэй.</div>}
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
