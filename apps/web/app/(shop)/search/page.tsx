import Link from "next/link";
import { prisma, type Prisma } from "@sankhuu/db";
import { ProductCard } from "../_components/product-card";
import {
  ALL_CATEGORIES,
  categoryStyle,
  publicProductWhere,
  soldCounts,
} from "../_components/catalog";
import { SearchBox } from "./search-box";
import { AskBar } from "../_components/ask-bar";
import { CategoryIcon } from "../_components/catalog-icons";
import {
  applyFilters,
  buildFacets,
  isOnSale,
  parseFilters,
  sortProducts,
} from "../_components/filters";
import { FiltersPanel, SortChips } from "../_components/filters-panel";

export const metadata = { title: "Хайх · Sankhuu" };

type Params = {
  q?: string;
  sale?: string;
  new?: string;
  hot?: string;
  sort?: string;
  cat?: string;
  min?: string;
  max?: string;
  shop?: string;
  rating?: string;
  stock?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  // Түргэн цэсний горим: sale=1 (q хоосон) / new=1 / hot=1. `sale` мөн шүүлтүүр тул q-тэй хамт ирвэл шүүлтүүр гэж үзнэ.
  const mode = sp.new ? "new" : sp.hot ? "hot" : sp.sale && !q ? "sale" : null;
  const defaultSort = mode === "new" ? "new" : "rank";
  const f = parseFilters(
    { ...sp, sale: mode === "sale" ? undefined : sp.sale },
    defaultSort,
  );
  const sort = f.sort;
  const title =
    mode === "sale"
      ? "Хямдралтай бараа"
      : mode === "new"
        ? "Шинэ бараа"
        : mode === "hot"
          ? "Эрэлттэй бараа"
          : null;
  const base = { ...(q ? { q } : {}), ...(mode ? { [mode]: "1" } : {}) };

  const where: Prisma.ProductWhereInput = {
    ...publicProductWhere,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { shop: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(mode === "sale" ? { compareAtPrice: { not: null } } : {}),
    ...(mode ? { stock: { gt: 0 } } : {}),
  };
  const run = Boolean(q || mode);
  let products = run
    ? await prisma.product.findMany({
        where,
        include: { shop: { select: { slug: true, name: true } } },
        orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
        take: 200,
      })
    : [];
  if (mode === "sale") products = products.filter(isOnSale);
  const sold = await soldCounts(products.map((p) => p.id));
  if (mode === "hot")
    products = products.filter((p) => (sold.get(p.id) ?? 0) > 0);
  const facets = buildFacets(products); // шүүлтүүрээс өмнөх багцаас дэлгүүр, ангиллын тоо
  products = sortProducts(applyFilters(products, f), sort, sold);

  return (
    <>
      <SearchBox initial={q} />
      {!run && (
        <>
          <AskBar
            title="Юу хайж байгаагаа энгийнээр бичээрэй"
            text="«Найздаа төрсөн өдрийн бэлэг, 80 мянга хүртэл» — AI туслах олж өгнө"
          />
          <section className="recent">
            <div className="recent-head">
              <span>Ангиллаар хайх</span>
            </div>
            <div className="chips">
              {ALL_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/categories/${encodeURIComponent(c)}`}
                  className="chip icon"
                  style={{
                    ["--chip-bg" as string]: categoryStyle(c).background,
                  }}
                >
                  <CategoryIcon name={c} size={16} /> {c}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
      {run && products.length === 0 && (
        <div className="pad">
          <AskBar
            title="AI туслахаас асууж үзэх үү?"
            text={`«${title ?? q}» гэж хайхад олдсонгүй; өөрөөр тайлбарлаад асуугаарай`}
            prompt={
              q
                ? `${q} гэж хайгаад олдсонгүй. Үүнтэй төстэй эсвэл орлох бараа санал болгооч.`
                : undefined
            }
          />
        </div>
      )}
      {run && (
        <div className="results-layout">
          <FiltersPanel
            basePath="/search"
            base={base}
            filters={f}
            facets={facets}
            total={products.length}
            defaultSort={defaultSort}
            showCategory
          />
          <div className="results-main">
            <p className="result-count">
              {title ? <strong>{title}</strong> : <>«{q}»</>} ·{" "}
              {products.length} бараа
            </p>
            <SortChips
              basePath="/search"
              base={base}
              filters={f}
              defaultSort={defaultSort}
            />
            {products.length === 0 && (
              <div className="empty">
                Тохирох бараа олдсонгүй. Шүүлтүүрээ цэвэрлэх эсвэл өөр үгээр
                хайж үзээрэй.
              </div>
            )}
            {products.length > 0 && (
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
