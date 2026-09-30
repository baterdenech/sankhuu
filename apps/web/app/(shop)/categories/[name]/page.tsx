import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { TopBar } from "../../_components/top-bar";
import { ProductCard } from "../../_components/product-card";
import {
  ALL_CATEGORIES,
  publicProductWhere,
  soldCounts,
} from "../../_components/catalog";
import {
  applyFilters,
  buildFacets,
  parseFilters,
  sortProducts,
} from "../../_components/filters";
import { FiltersPanel, SortChips } from "../../_components/filters-panel";

type Params = {
  sort?: string;
  min?: string;
  max?: string;
  shop?: string;
  rating?: string;
  stock?: string;
  sale?: string;
};

// Ангиллын бараа: шүүлтүүр (үнэ, дэлгүүр, үнэлгээ, бэлэн, хямдрал) + эрэмбэ, хайлтын хуудастай ижил
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<Params>;
}) {
  const name = decodeURIComponent((await params).name);
  if (!(ALL_CATEGORIES as readonly string[]).includes(name)) notFound();
  const f = parseFilters(await searchParams);
  const basePath = `/categories/${encodeURIComponent(name)}`;
  const all = await prisma.product.findMany({
    where: { ...publicProductWhere, category: name },
    include: { shop: { select: { slug: true, name: true } } },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  const sold = await soldCounts(all.map((p) => p.id));
  const facets = buildFacets(all);
  const products = sortProducts(applyFilters(all, f), f.sort, sold);
  return (
    <>
      <TopBar title={name} backHref="/categories" />
      {all.length === 0 ? (
        <div className="empty">Энэ ангилалд бараа алга.</div>
      ) : (
        <div className="results-layout">
          <FiltersPanel
            basePath={basePath}
            base={{}}
            filters={f}
            facets={facets}
            total={products.length}
          />
          <div className="results-main">
            <p className="result-count">
              <strong>{name}</strong> · {products.length} бараа
            </p>
            <SortChips basePath={basePath} base={{}} filters={f} />
            {products.length === 0 ? (
              <div className="empty">
                Шүүлтүүрт тохирох бараа алга. Шүүлтүүрээ цэвэрлэж үзээрэй.
              </div>
            ) : (
              <div className="pgrid pad">
                {products.map((p) => (
                  <ProductCard key={p.id} p={{ ...p, sold: sold.get(p.id) }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
