"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="copy-link">
      <code>{url}</code>
      <button
        type="button"
        className="btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {}
        }}
      >
        {done ? "Хуулав" : "Хуулах"}
      </button>
    </div>
  );
}
