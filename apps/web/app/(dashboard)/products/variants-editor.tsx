"use client";

import { useState } from "react";
import { MAX_VARIANTS, type VariantInput } from "@/lib/variants";

type Row = { id?: string; name: string; stock: string; price: string };

// Барааны хувилбарын засварлагч: мөр бүр нэр · үлдэгдэл · үнэ (заавал биш). Hidden `variants` JSON-оор илгээнэ.
// Хувилбар нэмэхэд барааны ерөнхий үлдэгдэл нийлбэрээр тооцогдоно (form дээр харуулна).
export function VariantsEditor({
  initial,
  onTotalChange,
}: {
  initial: VariantInput[];
  onTotalChange: (total: number | null) => void;
}) {
  const [rows, setRows] = useState<Row[]>(
    initial.map((v) => ({
      id: v.id,
      name: v.name,
      stock: String(v.stock),
      price: v.price === null ? "" : String(v.price),
    })),
  );
  const emit = (next: Row[]) => {
    setRows(next);
    const named = next.filter((r) => r.name.trim());
    onTotalChange(
      named.length
        ? named.reduce((s, r) => s + (Number(r.stock) || 0), 0)
        : null,
    );
  };
  const update = (i: number, patch: Partial<Row>) =>
    emit(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const payload = rows
    .filter((r) => r.name.trim())
    .map((r) => ({
      id: r.id,
      name: r.name.trim(),
      stock: Number(r.stock) || 0,
      price: r.price ? Number(r.price) : null,
    }));

  return (
    <fieldset className="fieldset variants">
      <legend>
        Хувилбар <span className="muted">(размер, өнгө г.м. · заавал биш)</span>
      </legend>
      <input type="hidden" name="variants" value={JSON.stringify(payload)} />
      {rows.length > 0 && (
        <div className="variant-head muted small-text">
          <span>Нэр</span>
          <span>Үлдэгдэл</span>
          <span>Үнэ (хоосон бол барааны үнэ)</span>
          <span />
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className="variant-row">
          <input
            value={r.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder={i === 0 ? "Жишээ: M эсвэл L / Хар" : "Нэр"}
            maxLength={40}
            aria-label="Хувилбарын нэр"
          />
          <input
            type="number"
            min={0}
            value={r.stock}
            onChange={(e) => update(i, { stock: e.target.value })}
            aria-label="Үлдэгдэл"
          />
          <input
            inputMode="numeric"
            value={r.price}
            onChange={(e) =>
              update(i, { price: e.target.value.replace(/[^\d]/g, "") })
            }
            placeholder="—"
            aria-label="Үнэ"
          />
          <button
            type="button"
            className="link-button"
            onClick={() => emit(rows.filter((_, j) => j !== i))}
            aria-label="Хасах"
          >
            ×
          </button>
        </div>
      ))}
      {rows.length < MAX_VARIANTS && (
        <div className="variant-actions">
          <button
            type="button"
            className="btn"
            onClick={() => emit([...rows, { name: "", stock: "1", price: "" }])}
          >
            + Хувилбар нэмэх
          </button>
          {rows.length === 0 && (
            <button
              type="button"
              className="btn"
              onClick={() =>
                emit(
                  ["S", "M", "L", "XL"].map((n) => ({
                    name: n,
                    stock: "1",
                    price: "",
                  })),
                )
              }
            >
              S · M · L · XL
            </button>
          )}
        </div>
      )}
      {rows.some((r) => r.name.trim()) && (
        <p className="muted small-text" style={{ margin: 0 }}>
          Худалдан авагч хувилбараа сонгож захиална; үлдэгдэл хувилбар бүрээр
          хасагдана.
        </p>
      )}
    </fieldset>
  );
}
