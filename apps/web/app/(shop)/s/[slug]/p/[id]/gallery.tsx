"use client";

import { useEffect, useRef, useState } from "react";
import { ProductImage } from "../../../../_components/product-image";

// Гүйлгэдэг зургийн галерей + "1 / N" тоолуур + цэгүүд
export function Gallery({ images, alt, category }: { images: string[]; alt: string; category?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const list = images.length ? images : [""];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setI(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="pdp-media">
      <div className="gallery" ref={ref}>
        {list.map((src, idx) => (
          <div key={idx} className="gallery-slide">
            <ProductImage src={src || undefined} alt={alt} category={category} />
          </div>
        ))}
      </div>
      {list.length > 1 && (
        <>
          <span className="pdp-counter">
            {i + 1} / {list.length}
          </span>
          <div className="gallery-dots" aria-hidden>
            {list.map((_, idx) => (
              <span key={idx} className={idx === i ? "on" : ""} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
