"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartIcon, GridIcon, HomeIcon, SearchIcon, UserIcon } from "./icons";
import { useCart } from "./cart-store";

const TABS = [
  { href: "/", label: "Нүүр", Icon: HomeIcon, match: (p: string) => p === "/" || p.startsWith("/s/") },
  { href: "/categories", label: "Ангилал", Icon: GridIcon, match: (p: string) => p.startsWith("/categories") },
  { href: "/search", label: "Хайх", Icon: SearchIcon, match: (p: string) => p.startsWith("/search") },
  { href: "/me", label: "Миний", Icon: UserIcon, match: (p: string) => p.startsWith("/me") || p.startsWith("/orders") },
  { href: "/cart", label: "Сагс", Icon: CartIcon, match: (p: string) => p.startsWith("/cart") },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();
  return (
    <nav className="bnav" aria-label="Үндсэн цэс">
      {TABS.map(({ href, label, Icon, match }) => (
        <Link key={href} href={href} className={`bnav-item${match(pathname) ? " on" : ""}`} aria-current={match(pathname) ? "page" : undefined}>
          <span className="bnav-icon">
            <Icon />
            {href === "/cart" && count > 0 && <span className="bnav-badge">{count > 99 ? "99+" : count}</span>}
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
