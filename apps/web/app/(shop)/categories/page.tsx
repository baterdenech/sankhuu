import Link from "next/link";
import { ALL_CATEGORIES, CATEGORY_ICONS, categoryCounts } from "../_components/catalog";

// Бараа DB-ээс ирдэг тул хүсэлт бүрт render хийнэ (build үед урьдчилж үүсгэхгүй)
export const dynamic = "force-dynamic";

export const metadata = { title: "Ангилал · Sankhuu" };

export default async function CategoriesPage() {
  const counts = await categoryCounts();
  return (
    <>
      <header className="topbar plain">
        <h1 className="topbar-title">Ангилал</h1>
      </header>
      <ul className="cat-list">
        {ALL_CATEGORIES.map((c) => (
          <li key={c}>
            <Link href={`/categories/${encodeURIComponent(c)}`} className="cat-row">
              <span className="cat-icon">{CATEGORY_ICONS[c]}</span>
              <span className="cat-row-name">{c}</span>
              <span className="muted">{counts.get(c) ?? 0} бараа</span>
              <span className="chev">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
