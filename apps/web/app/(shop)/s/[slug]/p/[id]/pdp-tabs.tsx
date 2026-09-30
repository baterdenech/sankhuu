"use client";

import { useEffect, useState } from "react";

// Coupang-ийн барааны хуудасны наалддаг таб (상품정보 · 리뷰 · 판매자): доош гүйлгэхэд идэвхтэй таб солигдоно
export function PdpTabs({ tabs }: { tabs: { id: string; label: string }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  useEffect(() => {
    const els = tabs.map((t) => document.getElementById(t.id)).filter((x): x is HTMLElement => Boolean(x));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-100px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tabs]);
  return (
    <nav className="pdp-tabs" aria-label="Хэсгүүд">
      {tabs.map((t) => (
        <a key={t.id} href={`#${t.id}`} className={active === t.id ? "on" : ""} onClick={() => setActive(t.id)}>
          {t.label}
        </a>
      ))}
    </nav>
  );
}
