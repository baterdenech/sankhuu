"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackIcon } from "./icons";

// Дотоод хуудасны дээд мөр: буцах товч + гарчиг + баруун талын нэмэлт
export function TopBar({ title, right, backHref }: { title: string; right?: React.ReactNode; backHref?: string }) {
  const router = useRouter();
  return (
    <header className="topbar">
      {backHref ? (
        <Link href={backHref} className="topbar-back" aria-label="Буцах">
          <BackIcon />
        </Link>
      ) : (
        <button type="button" className="topbar-back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))} aria-label="Буцах">
          <BackIcon />
        </button>
      )}
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-right">{right}</div>
    </header>
  );
}
