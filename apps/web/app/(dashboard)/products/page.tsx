import Link from "next/link";
import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { formatMNT, LOW_STOCK } from "@/lib/labels";
import { StockControl } from "./stock-control";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const { shop } = await requireShop();
  const { filter, q } = await searchParams;

  const products = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      isActive: true,
      ...(filter === "low" ? { stock: { lte: LOW_STOCK } } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-head">
        <h1>Бараа</h1>
        <div className="actions">
          <Link href="/products/bulk" className="btn">
            Олноор нэмэх
          </Link>
          <Link href="/products/new" className="btn primary">
            + Бараа нэмэх
          </Link>
        </div>
      </div>

      <form className="toolbar" action="/products">
        <input type="search" name="q" defaultValue={q ?? ""} placeholder="Нэрээр хайх…" aria-label="Хайх" />
        {filter && <input type="hidden" name="filter" value={filter} />}
        <Link href="/products" className={`chip${!filter ? " on" : ""}`}>
          Бүгд
        </Link>
        <Link href="/products?filter=low" className={`chip${filter === "low" ? " on" : ""}`}>
          Дуусч байгаа
        </Link>
      </form>

      {products.length === 0 ? (
        <div className="empty">
          {q || filter ? (
            <p>Тохирох бараа олдсонгүй.</p>
          ) : (
            <>
              <p>Бараа нэмээгүй байна. Зургийг нь оруулахад нэр, тайлбарыг AI бөглөж өгнө.</p>
              <Link href="/products/new" className="btn primary">
                Эхний бараагаа нэмэх
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="product-grid">
          {products.map((p) => (
            <li key={p.id} className="product-card">
              <Link href={`/products/${p.id}`} className="product-media">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} loading="lazy" />
                ) : (
                  <span className="no-image">Зураггүй</span>
                )}
                {p.stock === 0 && <span className="badge out">Дууссан</span>}
                {p.stock > 0 && p.stock <= LOW_STOCK && <span className="badge low">{p.stock} үлдсэн</span>}
              </Link>
              <div className="product-body">
                <Link href={`/products/${p.id}`} className="product-name">
                  {p.name}
                </Link>
                <div className="product-meta">
                  <span className="price">{formatMNT(p.price)}</span>
                  {p.category && <span className="muted small-text">{p.category}</span>}
                </div>
                <StockControl id={p.id} stock={p.stock} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
