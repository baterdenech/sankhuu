"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { createProducts, draftFromImage, type BulkRow } from "../actions";
import { compressImage } from "../compress-image";

type Row = BulkRow & { key: string; status: "loading" | "ready" | "error"; error?: string; preview: string };

// Олон зураг сонгоход зураг бүр хадгалагдаж, AI нэр/тайлбар/ангилал/үнэ санал болгоно; худалдагч засаад нэг дор хадгална
export function BulkForm({ ai }: { ai: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, startSave] = useTransition();
  const [result, setResult] = useState<{ created?: number; error?: string } | null>(null);
  const patch = (key: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 50 - rows.length);
    e.target.value = "";
    const fresh: Row[] = files.map((f) => ({ key: `${Date.now()}-${Math.random()}`, imageUrl: "", name: "", description: "", category: "", price: 0, stock: 1, status: "loading", preview: URL.createObjectURL(f) }));
    setRows((rs) => [...rs, ...fresh]);
    // 3 зэрэг: серверийн ачаалал, AI зардал тэнцвэртэй
    let i = 0;
    const worker = async () => {
      while (i < files.length) {
        const idx = i++;
        const row = fresh[idx];
        try {
          const small = await compressImage(files[idx]);
          const fd = new FormData();
          fd.set("image", small);
          const r = await draftFromImage(fd);
          if ("error" in r) patch(row.key, { status: "error", error: r.error });
          else patch(row.key, { status: "ready", imageUrl: r.imageUrl, name: r.name, description: r.description, category: r.category, price: r.price ?? 0 });
        } catch {
          patch(row.key, { status: "error", error: "Ачаалж чадсангүй." });
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  const ready = rows.filter((r) => r.status === "ready");
  const loading = rows.some((r) => r.status === "loading");

  return (
    <div className="bulk">
      <label className="bulk-drop">
        <input type="file" accept="image/*" multiple onChange={onPick} disabled={saving} />
        <strong>{rows.length ? "+ Дахиад зураг нэмэх" : "Зургуудаа сонгох"}</strong>
        <span className="muted small-text">{ai ? "Зураг бүрийг AI таньж нэр, тайлбар, ангилал, үнэ санал болгоно. Дараа нь засаад нэг дор хадгална." : "AI идэвхгүй: нэр, үнийг гараар бөглөнө."}</span>
      </label>

      {rows.length > 0 && (
        <ul className="bulk-list">
          {rows.map((r, idx) => (
            <li key={r.key} className={`bulk-row ${r.status}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.preview} alt="" className="bulk-thumb" />
              {r.status === "loading" ? (
                <div className="bulk-body">
                  <p className="ai-status">
                    <span className="spinner" /> {ai ? "AI шинжилж байна…" : "Хадгалж байна…"}
                  </p>
                </div>
              ) : r.status === "error" ? (
                <div className="bulk-body">
                  <p className="form-error">{r.error}</p>
                </div>
              ) : (
                <div className="bulk-body">
                  <input value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} placeholder="Барааны нэр" maxLength={80} aria-label="Нэр" />
                  <div className="bulk-fields">
                    <input type="number" value={r.price || ""} onChange={(e) => patch(r.key, { price: Number(e.target.value) })} placeholder="Үнэ ₮" min={0} aria-label="Үнэ" />
                    <input type="number" value={r.stock} onChange={(e) => patch(r.key, { stock: Number(e.target.value) })} placeholder="Үлдэгдэл" min={0} aria-label="Үлдэгдэл" />
                    <select value={r.category} onChange={(e) => patch(r.key, { category: e.target.value })} aria-label="Ангилал">
                      <option value="">Ангилал</option>
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <textarea value={r.description} onChange={(e) => patch(r.key, { description: e.target.value })} rows={2} placeholder="Тайлбар" maxLength={600} aria-label="Тайлбар" />
                </div>
              )}
              <button type="button" className="link-button bulk-remove" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} aria-label={`${idx + 1}-р мөрийг хасах`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {result?.error && <p className="form-error">{result.error}</p>}
      {rows.length > 0 && (
        <div className="bulk-actions">
          <span className="muted small-text">
            {ready.length} бараа бэлэн{loading ? ", зарим нь ачаалж байна" : ""}
          </span>
          <button
            type="button"
            className="btn primary"
            disabled={saving || loading || ready.length === 0}
            onClick={() =>
              startSave(async () => {
                const r = await createProducts(ready.map(({ imageUrl, name, description, category, price, stock }) => ({ imageUrl, name, description, category, price, stock })));
                setResult(r);
                if (r.created) router.push("/products");
              })
            }
          >
            {saving ? "Хадгалж байна…" : `${ready.length} бараа хадгалах`}
          </button>
        </div>
      )}
      {rows.length === 0 && (
        <p className="muted small-text">
          Нэг нэгээр нь нэмэх бол <Link href="/products/new">энд</Link>.
        </p>
      )}
    </div>
  );
}
