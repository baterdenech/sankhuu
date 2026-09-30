"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PRICE_PRESETS,
  SORTS,
  activeCount,
  parseFilters,
  toQuery,
  type Facets,
  type Filters,
  type SortKey,
} from "./filters";
import { FilterIcon } from "./catalog-icons";

type Props = {
  basePath: string;
  base: Record<string, string>; // q, горим г.м. (шүүлтүүр солиход хадгалагдана)
  filters: Filters;
  facets: Facets;
  total: number;
  defaultSort?: SortKey;
  showCategory?: boolean;
};

// Шүүлтүүр: PC дээр зүүн багана (Coupang маяг), утсан дээр "Шүүлтүүр" товч → доод sheet. Нэг GET форм, сонголт бүр URL параметр.
export function FiltersPanel({
  basePath,
  base,
  filters: f,
  facets,
  total,
  defaultSort = "rank",
  showCategory = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  // Формыг өөрсдөө URL болгоно: хоосон утгыг хаяж цэвэрхэн query үүсгэнэ
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw: Record<string, string> = {};
    fd.forEach((v, k) => (raw[k] = String(v)));
    router.push(
      basePath + toQuery(base, parseFilters(raw, defaultSort), defaultSort),
    );
    setOpen(false);
  };
  const n = activeCount(f);
  const href = (patch: Partial<Filters>) =>
    basePath + toQuery(base, { ...f, ...patch }, defaultSort);
  // PC дээр сонголт солимогц шууд хэрэглэнэ; утсан дээр "Харах" товчоор
  const auto = () => {
    if (window.matchMedia("(min-width: 900px)").matches)
      formRef.current?.requestSubmit();
  };
  const chips: { label: string; patch: Partial<Filters> }[] = [
    ...(f.cat ? [{ label: f.cat, patch: { cat: null } }] : []),
    ...(f.min || f.max
      ? [{ label: priceLabel(f.min, f.max), patch: { min: null, max: null } }]
      : []),
    ...(f.shop
      ? [
          {
            label:
              facets.shops.find((s) => s.slug === f.shop)?.name ?? "Дэлгүүр",
            patch: { shop: null },
          },
        ]
      : []),
    ...(f.rating
      ? [{ label: `${f.rating}★ ба дээш`, patch: { rating: null } }]
      : []),
    ...(f.stock ? [{ label: "Бэлэн байгаа", patch: { stock: false } }] : []),
    ...(f.sale ? [{ label: "Хямдралтай", patch: { sale: false } }] : []),
  ];

  return (
    <>
      {/* Утас: товч + идэвхтэй шүүлтүүрийн чипүүд */}
      <div className="filter-bar">
        <button
          type="button"
          className={`chip icon${n ? " on" : ""}`}
          onClick={() => setOpen(true)}
        >
          <FilterIcon size={16} /> Шүүлтүүр{n ? ` · ${n}` : ""}
        </button>
        {chips.map((c) => (
          <Link key={c.label} href={href(c.patch)} className="chip active-chip">
            {c.label} <span aria-hidden>×</span>
          </Link>
        ))}
      </div>
      {open && (
        <div className="filters-backdrop" onClick={() => setOpen(false)} />
      )}
      <aside className={`filters${open ? " open" : ""}`} aria-label="Шүүлтүүр">
        <form
          ref={formRef}
          action={basePath}
          method="get"
          className="filters-form"
          onSubmit={submit}
        >
          {Object.entries(base).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          {f.sort !== defaultSort && (
            <input type="hidden" name="sort" value={f.sort} />
          )}
          <div className="filters-head">
            <strong>Шүүлтүүр</strong>
            {n > 0 && (
              <Link
                href={basePath + toQuery(base, { sort: f.sort }, defaultSort)}
                className="link-button small-text"
              >
                Цэвэрлэх
              </Link>
            )}
            <button
              type="button"
              className="filters-close"
              onClick={() => setOpen(false)}
              aria-label="Хаах"
            >
              ×
            </button>
          </div>

          {showCategory && facets.categories.length > 0 && (
            <fieldset className="filter-group">
              <legend>Ангилал</legend>
              <label>
                <input
                  type="radio"
                  name="cat"
                  value=""
                  defaultChecked={!f.cat}
                  onChange={auto}
                />{" "}
                Бүгд
              </label>
              {facets.categories.map((c) => (
                <label key={c.name}>
                  <input
                    type="radio"
                    name="cat"
                    value={c.name}
                    defaultChecked={f.cat === c.name}
                    onChange={auto}
                  />{" "}
                  {c.name} <span className="muted">{c.count}</span>
                </label>
              ))}
            </fieldset>
          )}

          <fieldset className="filter-group">
            <legend>Үнэ</legend>
            {PRICE_PRESETS.map((p) => {
              const on = f.min === p.min && f.max === p.max;
              return (
                <label key={p.label}>
                  <input
                    type="radio"
                    name="price"
                    form="none"
                    value={`${p.min ?? ""}-${p.max ?? ""}`}
                    defaultChecked={on}
                    onChange={() =>
                      setPrice(formRef.current, p.min, p.max, auto)
                    }
                  />{" "}
                  {p.label}
                </label>
              );
            })}
            <div className="price-range">
              <input
                name="min"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Доод"
                defaultValue={f.min ?? ""}
                aria-label="Доод үнэ"
              />
              <span>–</span>
              <input
                name="max"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Дээд"
                defaultValue={f.max ?? ""}
                aria-label="Дээд үнэ"
              />
              <button
                type="submit"
                className="btn small"
                aria-label="Үнээр шүүх"
              >
                ›
              </button>
            </div>
          </fieldset>

          {facets.shops.length > 1 && (
            <fieldset className="filter-group">
              <legend>Дэлгүүр</legend>
              <label>
                <input
                  type="radio"
                  name="shop"
                  value=""
                  defaultChecked={!f.shop}
                  onChange={auto}
                />{" "}
                Бүх дэлгүүр
              </label>
              {facets.shops.slice(0, 12).map((s) => (
                <label key={s.slug}>
                  <input
                    type="radio"
                    name="shop"
                    value={s.slug}
                    defaultChecked={f.shop === s.slug}
                    onChange={auto}
                  />{" "}
                  {s.name} <span className="muted">{s.count}</span>
                </label>
              ))}
            </fieldset>
          )}

          <fieldset className="filter-group">
            <legend>Үнэлгээ</legend>
            <label>
              <input
                type="radio"
                name="rating"
                value=""
                defaultChecked={!f.rating}
                onChange={auto}
              />{" "}
              Бүгд
            </label>
            <label>
              <input
                type="radio"
                name="rating"
                value="4"
                defaultChecked={f.rating === 4}
                onChange={auto}
              />{" "}
              <span className="stars-inline">★★★★</span> 4 ба дээш
            </label>
            <label>
              <input
                type="radio"
                name="rating"
                value="3"
                defaultChecked={f.rating === 3}
                onChange={auto}
              />{" "}
              <span className="stars-inline">★★★</span> 3 ба дээш
            </label>
          </fieldset>

          <fieldset className="filter-group">
            <legend>Бусад</legend>
            <label>
              <input
                type="checkbox"
                name="stock"
                value="1"
                defaultChecked={f.stock}
                onChange={auto}
              />{" "}
              Зөвхөн бэлэн байгаа
            </label>
            <label>
              <input
                type="checkbox"
                name="sale"
                value="1"
                defaultChecked={f.sale}
                onChange={auto}
              />{" "}
              Зөвхөн хямдралтай
            </label>
          </fieldset>

          <div className="filters-foot">
            <button type="submit" className="btn primary big">
              Харах{total ? ` (${total})` : ""}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

// Эрэмбийн чипүүд: шүүлтүүрийг хадгалж эрэмбэ солино
export function SortChips({
  basePath,
  base,
  filters: f,
  defaultSort = "rank",
}: {
  basePath: string;
  base: Record<string, string>;
  filters: Filters;
  defaultSort?: SortKey;
}) {
  return (
    <nav className="chips scroll sort" aria-label="Эрэмбэлэх">
      {SORTS.map((s) => (
        <Link
          key={s.key}
          href={basePath + toQuery(base, { ...f, sort: s.key }, defaultSort)}
          className={`chip${f.sort === s.key ? " on" : ""}`}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );
}

function priceLabel(min: number | null, max: number | null) {
  const k = (n: number) =>
    n >= 1_000_000 ? `${n / 1_000_000} сая` : `${Math.round(n / 1000)} мянга`;
  if (min && max) return `${k(min)} – ${k(max)}`;
  if (max) return `${k(max)} хүртэл`;
  return `${k(min!)}-с дээш`;
}

// Үнийн бэлэн сонголт → min/max талбар (нэг л хос параметр явна)
function setPrice(
  form: HTMLFormElement | null,
  min: number | null,
  max: number | null,
  after: () => void,
) {
  if (!form) return;
  (form.elements.namedItem("min") as HTMLInputElement).value = min
    ? String(min)
    : "";
  (form.elements.namedItem("max") as HTMLInputElement).value = max
    ? String(max)
    : "";
  after();
}
