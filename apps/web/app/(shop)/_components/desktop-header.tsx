"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CartIcon, GridIcon, SearchIcon, UserIcon } from "./icons";
import { CartBadge } from "./cart-badge";
import { CategoryIcon } from "./catalog-icons";
import { ALL_CATEGORIES, categoryStyle } from "./catalog-meta";

// PC дэлгэцийн дээд хэсэг (≥900px), Coupang-ийн бүтцээр:
//   1) тусламжийн нарийн мөр (хүргэлтийн амлалт · нэвтрэх/бүртгүүлэх · худалдагч болох)
//   2) үндсэн мөр: "Ангилал" том товч (hover-оор цэс) · лого · өргөн хайлт · Миний · Сагс
// Утсан дээр CSS-ээр нуугдаж, доод таб (BottomNav) ажиллана.

// Хайлтын хуудсан дээр байгаа q-г талбарт харуулна (useSearchParams тул Suspense дотор)
function SearchField() {
  const q = useSearchParams().get("q") ?? "";
  return <input key={q} name="q" defaultValue={q} placeholder="Хайх бараагаа бичнэ үү" aria-label="Хайх" autoComplete="off" />;
}

export function DesktopHeader({ userName }: { userName: string | null }) {
  const pathname = usePathname();
  const on = (p: string) => pathname === p || pathname.startsWith(p + "/");
  return (
    <div className="dhead">
      <div className="dhead-util">
        <div className="dhead-in">
          <span className="muted">Sankhuu хүргэлт: Улаанбаатар хотод 5,000₮-с · 15:00-с өмнө захиалбал маргааш</span>
          <nav aria-label="Бүртгэл">
            {userName ? (
              <Link href="/me">{userName}</Link>
            ) : (
              <>
                <Link href="/login?mode=password&next=/me">Нэвтрэх</Link>
                <Link href="/login/register?as=buyer&next=/me">Бүртгүүлэх</Link>
              </>
            )}
            <Link href="/shops">Дэлгүүрүүд</Link>
            <Link href="/login/register" className="seller">
              Худалдагч болох
            </Link>
          </nav>
        </div>
      </div>
      <header className="dhead-main">
        <div className="dhead-in">
          <div className={`dcat${on("/categories") ? " on" : ""}`}>
            <Link href="/categories" className="dcat-btn">
              <GridIcon size={26} />
              <span>Ангилал</span>
            </Link>
            <div className="dcat-menu" role="menu">
              {ALL_CATEGORIES.map((c) => {
                const s = categoryStyle(c);
                return (
                  <Link key={c} href={`/categories/${encodeURIComponent(c)}`} role="menuitem">
                    <span className="dcat-ico" style={{ background: s.background, color: s.color }}>
                      <CategoryIcon name={c} size={18} />
                    </span>
                    {c}
                  </Link>
                );
              })}
            </div>
          </div>
          <Link href="/" className="logo dhead-logo" aria-label="Sankhuu нүүр">
            <span className="logo-mark">S</span>
            <span className="logo-text">Sankhuu</span>
          </Link>
          <form action="/search" role="search" className="dsearch">
            <Suspense fallback={<input name="q" placeholder="Хайх бараагаа бичнэ үү" aria-label="Хайх" autoComplete="off" />}>
              <SearchField />
            </Suspense>
            <button type="submit" aria-label="Хайх">
              <SearchIcon size={22} />
            </button>
          </form>
          <nav className="dnav" aria-label="Миний, сагс">
            <Link href="/me" className={on("/me") || on("/orders") || on("/reviews") ? "on" : ""}>
              <UserIcon size={28} filled={on("/me")} />
              <span>Миний</span>
            </Link>
            <Link href="/cart" className={on("/cart") ? "on" : ""}>
              <span className="bnav-icon">
                <CartIcon size={28} filled={on("/cart")} />
                <CartBadge />
              </span>
              <span>Сагс</span>
            </Link>
          </nav>
        </div>
      </header>
    </div>
  );
}
