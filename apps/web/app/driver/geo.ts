"use client";

import type { Geo } from "@/lib/delivery";

// Байршлыг 4 секундын дотор авч чадвал буцаана, үгүй бол null (үйлдлийг саатуулахгүй)
export function getGeo(): Promise<Geo> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    const done = (g: Geo) => resolve(g);
    const t = setTimeout(() => done(null), 4000);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(t);
        done({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        clearTimeout(t);
        done(null);
      },
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 },
    );
  });
}
