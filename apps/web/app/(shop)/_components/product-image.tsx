"use client";

import { useState } from "react";
import { categoryStyle } from "./catalog-meta";

// Зураг ачаалагдахгүй бол (холбоос эвдэрсэн г.м.) ангиллын placeholder руу шилжинэ
export function ProductImage({ src, alt, category, className = "" }: { src?: string | null; alt: string; category?: string | null; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" decoding="async" className={className} onError={() => setBroken(true)} />;
  }
  const { background, icon } = categoryStyle(category);
  return (
    <span className={`img-placeholder ${className}`} style={{ background }} aria-label="Зураггүй">
      <span>{icon}</span>
    </span>
  );
}
