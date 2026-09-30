"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "./icons";

// Coupang-ийн "골드박스" маягийн тоолуур: өнөөдрийн хямдрал Улаанбаатарын цагаар шөнө дунд дуусна
function msToMidnightUB(now: number) {
  const ub = now + 8 * 3600 * 1000;
  return 86400000 - (ub % 86400000);
}
const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(msToMidnightUB(Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const s = left === null ? null : Math.floor(left / 1000);
  return (
    <span className="countdown" aria-label="Хямдрал дуусахад үлдсэн хугацаа">
      <ClockIcon size={14} />
      {s === null ? "--:--:--" : `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`}
    </span>
  );
}
