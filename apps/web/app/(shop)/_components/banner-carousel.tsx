"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Banner = { title: string; text: string; emoji: string; cls: string; href?: string };

// Coupang маягийн баннер: гүйлгэхэд "1 / 3" тоолуур шинэчлэгдэнэ
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setI(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <section className="banners-wrap" aria-label="Мэдээлэл">
      <div className="banners" ref={ref}>
        {banners.map((b) => {
          const inner = (
            <>
              <span className="banner-text">
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </span>
              <span className="banner-emoji" aria-hidden>
                {b.emoji}
              </span>
            </>
          );
          return b.href ? (
            <Link key={b.title} href={b.href} className={`banner ${b.cls}`}>
              {inner}
            </Link>
          ) : (
            <div key={b.title} className={`banner ${b.cls}`}>
              {inner}
            </div>
          );
        })}
      </div>
      <span className="banner-counter">
        {i + 1} / {banners.length}
      </span>
    </section>
  );
}
