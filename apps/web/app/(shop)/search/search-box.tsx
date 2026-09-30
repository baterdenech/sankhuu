"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchIcon } from "../_components/icons";

const KEY = "sankhuu-recent-searches";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {}
  }, []);

  function go(term: string) {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    router.push(`/search?q=${encodeURIComponent(t)}`);
  }

  return (
    <>
      <form
        className="search-bar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
      >
        <SearchIcon size={20} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Бараа, дэлгүүр хайх" autoFocus={!initial} enterKeyHint="search" aria-label="Хайх" />
        {q && (
          <button type="button" className="search-clear" onClick={() => setQ("")} aria-label="Цэвэрлэх">
            ×
          </button>
        )}
      </form>
      {!initial && recent.length > 0 && (
        <section className="recent">
          <div className="recent-head">
            <span>Сүүлд хайсан</span>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setRecent([]);
                localStorage.removeItem(KEY);
              }}
            >
              Устгах
            </button>
          </div>
          <div className="chips">
            {recent.map((r) => (
              <button key={r} type="button" className="chip" onClick={() => go(r)}>
                {r}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
