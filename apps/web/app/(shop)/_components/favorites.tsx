"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HeartIcon } from "./catalog-icons";
import { toggleFavorite } from "./favorites-actions";

// Дуртай барааны төлөв: layout серверээс нэвтэрсэн хэрэглэгчийн id-уудыг өгнө; товч бүр optimistic шинэчилнэ
type Ctx = { ids: Set<string>; loggedIn: boolean; toggle: (productId: string) => void };
const FavCtx = createContext<Ctx>({ ids: new Set(), loggedIn: false, toggle: () => {} });

export function FavoritesProvider({ initial, loggedIn, children }: { initial: string[]; loggedIn: boolean; children: React.ReactNode }) {
  const [ids, setIds] = useState(() => new Set(initial));
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();
  const toggle = (productId: string) => {
    if (!loggedIn) {
      router.push(`/login?mode=password&next=${encodeURIComponent(pathname)}`);
      return;
    }
    const was = ids.has(productId);
    setIds((s) => {
      const n = new Set(s);
      if (was) n.delete(productId);
      else n.add(productId);
      return n;
    });
    start(async () => {
      const r = await toggleFavorite(productId);
      if (!r.auth) return router.push(`/login?mode=password&next=${encodeURIComponent(pathname)}`);
      setIds((s) => {
        const n = new Set(s);
        if (r.on) n.add(productId);
        else n.delete(productId);
        return n;
      });
    });
  };
  return <FavCtx.Provider value={{ ids, loggedIn, toggle }}>{children}</FavCtx.Provider>;
}

export function useFavorites() {
  return useContext(FavCtx);
}

// Зүрхэн товч: картан дээр (зурагны буланд) эсвэл барааны хуудсанд (дээд мөр)
export function HeartButton({ productId, size = 20, className = "" }: { productId: string; size?: number; className?: string }) {
  const { ids, toggle } = useFavorites();
  const on = ids.has(productId);
  return (
    <button
      type="button"
      className={`heart-btn${on ? " on" : ""} ${className}`}
      aria-pressed={on}
      aria-label={on ? "Дуртайгаас хасах" : "Дуртай бараанд нэмэх"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
    >
      <HeartIcon size={size} />
    </button>
  );
}
