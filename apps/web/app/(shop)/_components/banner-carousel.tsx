"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Banner = { title: string; text: string; cls: string; href?: string; image?: string | null; tag?: string };

// Coupang маягийн баннер: зурагтай (байвал) + градиент давхарга, гүйлгэхэд "1 / 3" тоолуур шинэчлэгдэнэ
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
              {b.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image} alt="" className="banner-img" loading="eager" />
              )}
              <span className="banner-text">
                {b.tag && <em className="banner-tag">{b.tag}</em>}
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </span>
            </>
          );
          const cls = `banner ${b.cls}${b.image ? " has-img" : ""}`;
          return b.href ? (
            <Link key={b.title} href={b.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <div key={b.title} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
      <span className="banner-counter">
        {i + 1} / {banners.length}
      </span>
      {/* PC: Coupang маягийн босоо таб (утсан дээр CSS-ээр нуугдана) */}
      <ul className="banner-tabs" aria-label="Баннерууд">
        {banners.map((b, idx) => (
          <li key={b.title}>
            <button type="button" className={idx === i ? "on" : ""} onClick={() => ref.current?.scrollTo({ left: idx * ref.current.clientWidth, behavior: "smooth" })}>
              <span className="banner-tab-text">
                <em>{b.tag}</em>
                <strong>{b.title}</strong>
              </span>
              {b.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image} alt="" className="banner-tab-img" />
              ) : (
                <span className={`banner-tab-img banner ${b.cls}`} />
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
