import Link from "next/link";
import { ALL_CATEGORIES, categoryCounts, categoryStyle } from "../_components/catalog";
import { CategoryIcon } from "../_components/catalog-icons";
import { ChevronIcon } from "../_components/icons";

// Бараа DB-ээс ирдэг тул хүсэлт бүрт render хийнэ (build үед урьдчилж үүсгэхгүй)
export const dynamic = "force-dynamic";

export const metadata = { title: "Ангилал · Sankhuu" };

// Coupang-ийн ангиллын хуудас: том дүрстэй тор (дэд ангилал орвол 2 багана болгоно)
export default async function CategoriesPage() {
  const counts = await categoryCounts();
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return (
    <>
      <header className="topbar plain">
        <h1 className="topbar-title">Ангилал</h1>
      </header>
      <div className="cat-tiles">
        {ALL_CATEGORIES.map((c) => {
          const s = categoryStyle(c);
          return (
            <Link key={c} href={`/categories/${encodeURIComponent(c)}`} className="cat-tile">
              <span className="cat-icon" style={{ background: s.background, color: s.color }}>
                <CategoryIcon name={c} size={28} />
              </span>
              <strong>{c}</strong>
              <span className="muted small-text">{counts.get(c) ?? 0} бараа</span>
            </Link>
          );
        })}
      </div>
      <ul className="list">
        <li>
          <Link href="/search?q=&sale=1" className="list-row">
            <span className="list-row-body">
              <strong>Хямдралтай бараа</strong>
              <span className="muted small-text">Бүх дэлгүүрийн хямдрал нэг дор</span>
            </span>
            <ChevronIcon size={18} className="chev" />
          </Link>
        </li>
        <li>
          <Link href="/shops" className="list-row">
            <span className="list-row-body">
              <strong>Бүх дэлгүүр</strong>
              <span className="muted small-text">{total} бараа</span>
            </span>
            <ChevronIcon size={18} className="chev" />
          </Link>
        </li>
      </ul>
    </>
  );
}
