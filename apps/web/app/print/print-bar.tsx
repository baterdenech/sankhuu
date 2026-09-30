"use client";

import { useEffect } from "react";

// Дээд мөр (хэвлэхэд харагдахгүй): хэвлэх, хаах товч; хуудас ачаалмагц хэвлэх цонхыг нэг удаа нээнэ
export function PrintBar({
  count,
  auto = true,
}: {
  count: number;
  auto?: boolean;
}) {
  useEffect(() => {
    if (!auto || count === 0) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [auto, count]);
  return (
    <div className="print-bar">
      <span>
        {count} хүргэлтийн хуудас · Хэвлэгч дээр A5 эсвэл A4 (2 хуудас / нүүр)
        сонгож болно
      </span>
      <span>
        <button type="button" onClick={() => window.print()}>
          Хэвлэх
        </button>
        <button type="button" onClick={() => window.close()}>
          Хаах
        </button>
      </span>
    </div>
  );
}
