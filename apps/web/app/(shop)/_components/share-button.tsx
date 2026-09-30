"use client";

import { useState } from "react";

export function ShareButton({ title, text }: { title: string; text?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="topbar-share"
      aria-label="Хуваалцах"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) await navigator.share({ title, text, url });
          else {
            await navigator.clipboard.writeText(url);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }
        } catch {}
      }}
    >
      {done ? (
        <span className="share-done">Хуулав</span>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
        </svg>
      )}
    </button>
  );
}
