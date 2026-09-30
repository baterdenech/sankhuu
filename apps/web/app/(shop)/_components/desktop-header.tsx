"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CartIcon, SearchIcon } from "./icons";
import { CartBadge } from "./cart-badge";

// PC дэлгэцийн дээд цэс (≥900px): лого · хайлт · Ангилал · Хямдрал · Дэлгүүрүүд · Миний · Сагс.
// Утсан дээр CSS-ээр нуугдаж, доод таб (BottomNav) ажиллана.
const LINKS = [
  { href: "/categories", label: "Ангилал", match: (p: string) => p.startsWith("/categories") },
  { href: "/search?q=&sale=1", label: "Хямдрал", match: () => false },
  { href: "/shops", label: "Дэлгүүрүүд", match: (p: string) => p.startsWith("/shops") || p.startsWith("/s/") },
  { href: "/me", label: "Миний", match: (p: string) => p.startsWith("/me") || p.startsWith("/orders") || p.startsWith("/reviews") },
];

// Хайлтын хуудсан дээр байгаа q-г дээд цэсний талбарт харуулна (useSearchParams тул Suspense дотор)
function SearchField() {
  const q = useSearchParams().get("q") ?? "";
  return <input key={q} name="q" defaultValue={q} placeholder="Бараа, дэлгүүр хайх" aria-label="Хайх" autoComplete="off" />;
}

export function DesktopHeader() {
  const pathname = usePathname();
  return (
    <header className="dhead">
      <div className="dhead-in">
        <Link href="/" className="logo dhead-logo" aria-label="Sankhuu нүүр">
          <span className="logo-mark">S</span>
          <span className="logo-text">Sankhuu</span>
        </Link>
        <form action="/search" role="search" className="dsearch">
          <SearchIcon size={20} />
          <Suspense fallback={<input name="q" placeholder="Бараа, дэлгүүр хайх" aria-label="Хайх" autoComplete="off" />}>
            <SearchField />
          </Suspense>
          <button type="submit" className="btn primary small">
            Хайх
          </button>
        </form>
        <nav className="dnav" aria-label="Үндсэн цэс">
          {LINKS.map((l) => {
            const on = l.match(pathname);
            return (
              <Link key={l.href} href={l.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
          <Link href="/cart" className={`dnav-cart${pathname.startsWith("/cart") ? " on" : ""}`} aria-label="Сагс">
            <span className="bnav-icon">
              <CartIcon />
              <CartBadge />
            </span>
            Сагс
          </Link>
        </nav>
      </div>
    </header>
  );
}
