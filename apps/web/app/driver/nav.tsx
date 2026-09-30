"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClockIcon, TruckIcon } from "../(shop)/_components/icons";

const CashIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="6.5" width="18" height="11" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6.5 9.5h.01M17.5 14.5h.01" strokeWidth="2.4" />
  </svg>
);

const TABS = [
  { href: "/driver", label: "Өнөөдөр", Icon: TruckIcon, match: (p: string) => p === "/driver" },
  { href: "/driver/history", label: "Түүх", Icon: ClockIcon, match: (p: string) => p.startsWith("/driver/history") },
  { href: "/driver/cash", label: "Мөнгө", Icon: CashIcon, match: (p: string) => p.startsWith("/driver/cash") },
];

export function DriverNav({ activeCount }: { activeCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="bnav" aria-label="Жолоочийн цэс">
      {TABS.map(({ href, label, Icon, match }) => {
        const on = match(pathname);
        return (
          <Link key={href} href={href} className={`bnav-item${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
            <span className="bnav-icon">
              <Icon />
              {href === "/driver" && activeCount > 0 && <span className="bnav-badge">{activeCount}</span>}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
