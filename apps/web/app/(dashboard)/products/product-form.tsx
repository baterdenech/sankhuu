"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { Product } from "@sankhuu/db";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import type { ProductDraft } from "@/lib/ai/product";
import { suggestFromImage, type FormState } from "./actions";
import { compressImage } from "./compress-image";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  submitLabel: string;
  ai: boolean;
  product?: Product;
};

export function ProductForm({ action, submitLabel, ai, product }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product?.images[0] ?? null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(String(product?.stock ?? 1));
  const [sku, setSku] = useState(product?.sku ?? "");
  const priceRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setAiError(null);
    const small = await compressImage(picked);
    setFile(small);
    setPreview(URL.createObjectURL(small));
    if (!ai) return;

    startAnalyze(async () => {
      const fd = new FormData();
      fd.set("image", small);
      const result = await suggestFromImage(fd);
      if (!result) {
        setAiError("AI зургийг таньж чадсангүй. Мэдээллийг гараар бөглөнө үү.");
        return;
      }
      setDraft(result);
      // Худалдагчийн бичсэн зүйлийг дарж бичихгүй
      setName((v) => v || result.name);
      setDescription((v) => v || result.description);
      setCategory((v) => v || result.category);
      if (!price && result.suggestedPriceMnt) setPrice(String(Math.round(result.suggestedPriceMnt / 1000) * 1000));
      priceRef.current?.focus();
    });
  }

  return (
    <form
      action={(fd) => {
        // Жижигрүүлсэн зургийг оригиналын оронд илгээнэ
        if (file) fd.set("image", file);
        else fd.delete("image");
        formAction(fd);
      }}
      className="form product-form"
    >
      <label className={`photo-drop${preview ? " has-image" : ""}`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Барааны зураг" />
        ) : (
          <span className="photo-hint">
            <strong>Зураг авах эсвэл сонгох</strong>
            {ai ? <small>Нэр, тайлбар, ангиллыг AI бөглөнө</small> : <small>JPG, PNG, WebP · 5MB хүртэл</small>}
          </span>
        )}
        <input type="file" name="image" accept="image/*" capture="environment" onChange={onPick} />
        {preview && <span className="photo-change">Зураг солих</span>}
      </label>

      {analyzing && (
        <p className="ai-status">
          <span className="spinner" /> AI зургийг шинжилж байна…
        </p>
      )}
      {draft && !analyzing && (
        <p className="ai-status ok">
          ✓ AI бөглөлөө{draft.colors.length ? ` · ${draft.colors.join(", ")}` : ""}. Шалгаад засаарай.
        </p>
      )}
      {aiError && <p className="ai-status warn">{aiError}</p>}

      <label htmlFor="name">Нэр</label>
      <input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="Жишээ: Эмэгтэй ноосон цамц, шаргал" />

      <div className="row">
        <div>
          <label htmlFor="price">Үнэ (₮)</label>
          <input ref={priceRef} id="price" name="price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))} required placeholder="0" />
        </div>
        <div>
          <label htmlFor="stock">Үлдэгдэл (ш)</label>
          <input id="stock" name="stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} required min={0} type="number" />
        </div>
      </div>

      <label htmlFor="category">Ангилал</label>
      <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Сонгоогүй</option>
        {PRODUCT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label htmlFor="description">Тайлбар</label>
      <textarea id="description" name="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} placeholder="Материал, өнгө, размер, онцлог" />

      <label htmlFor="sku">
        Код / SKU <span className="muted">(заавал биш)</span>
      </label>
      <input id="sku" name="sku" value={sku} onChange={(e) => setSku(e.target.value)} maxLength={40} />

      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending || analyzing}>
        {pending ? "Хадгалж байна…" : submitLabel}
      </button>
    </form>
  );
}
