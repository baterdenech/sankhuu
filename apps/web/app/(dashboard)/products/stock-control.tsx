"use client";

import { useOptimistic, useTransition } from "react";
import { adjustStock } from "./actions";

export function StockControl({ id, stock }: { id: string; stock: number }) {
  const [pending, startTransition] = useTransition();
  const [shown, setOptimistic] = useOptimistic(stock, (cur, delta: number) => Math.max(0, cur + delta));

  const change = (delta: number) =>
    startTransition(async () => {
      setOptimistic(delta);
      await adjustStock(id, delta);
    });

  return (
    <div className="stock" aria-live="polite">
      <button type="button" onClick={() => change(-1)} disabled={pending || shown === 0} aria-label="Нэгээр хасах">
        −
      </button>
      <span className={shown === 0 ? "zero" : ""}>{shown} ш</span>
      <button type="button" onClick={() => change(1)} disabled={pending} aria-label="Нэгээр нэмэх">
        +
      </button>
    </div>
  );
}
