"use client";

import { useActionState, useState } from "react";
import { compressImage } from "@/app/(dashboard)/products/compress-image";
import { submitReview, type ReviewState } from "../actions";

const LABELS = ["", "Муу", "Дунд", "Зүгээр", "Сайн", "Маш сайн"];

export function ReviewForm({ n, phone, productId }: { n: number; phone: string; productId: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, {});
  const [rating, setRating] = useState(Number(state.values?.rating) || 0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form
      className="review-form"
      action={(fd) => {
        if (file) fd.set("image", file);
        else fd.delete("image");
        action(fd);
      }}
    >
      <input type="hidden" name="n" value={n} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="product" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <p className="review-q">Бараа танд таалагдсан уу?</p>
      <div className="stars-input" role="radiogroup" aria-label="Од">
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} type="button" role="radio" aria-checked={rating === v} aria-label={`${v} од`} className={v <= rating ? "on" : ""} onClick={() => setRating(v)}>
            ★
          </button>
        ))}
      </div>
      <p className="stars-label">{rating ? LABELS[rating] : "Од сонгоно уу"}</p>

      <label htmlFor="comment">Сэтгэгдэл</label>
      <textarea id="comment" name="comment" rows={4} maxLength={1000} defaultValue={state.values?.comment ?? ""} placeholder="Чанар, размер, хүргэлтийн талаар бусдад хэрэгтэй мэдээлэл бичээрэй" />

      <label className="review-photo">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" />
        ) : (
          <span>📷 Зураг нэмэх (заавал биш)</span>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const small = await compressImage(f, 1024, 0.8);
            setFile(small);
            setPreview(URL.createObjectURL(small));
          }}
        />
      </label>

      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn big primary" disabled={pending || rating === 0}>
        {pending ? "Илгээж байна…" : "Үнэлгээ илгээх"}
      </button>
    </form>
  );
}
