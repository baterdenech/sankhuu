import { formatMNT } from "@/lib/labels";
import {
  compactNumber,
  niceMax,
  type StatusGroup,
  type TopProduct,
} from "@/lib/stats";

// ─── Статистикийн графикууд: HTML/CSS дээр зурагдана, hover/фокус дээр tooltip гарна ───

type ColumnPoint = { label: string; value: number; tip: string; sub?: string };

// Босоо баганан график: нэг цуврал (брэнд өнгө), нимгэн багана, дээд тал 4px дугуй, hairline тор
export function ColumnChart({
  points,
  unit,
  tickEvery = 1,
  formatValue,
}: {
  points: ColumnPoint[];
  unit: string;
  tickEvery?: number;
  formatValue?: (n: number) => string;
}) {
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
  // Бүхэл тоон цуврал (захиалгын тоо) дээр давхардсан "1 1 1" тэмдэглэгээ гаргахгүй
  const steps = max < 4 ? max : 4;
  const ticks = Array.from(
    { length: steps + 1 },
    (_, i) => (steps - i) / steps,
  );
  const fmt = formatValue ?? compactNumber;
  const empty = points.every((p) => p.value === 0);
  return (
    <div className="chart-plot" aria-hidden={empty ? undefined : true}>
      <div className="chart-y">
        {ticks.map((t) => (
          <span key={t}>{fmt(Math.round(max * t))}</span>
        ))}
      </div>
      <div className="chart-area">
        <div className="chart-grid">
          {ticks.map((t) => (
            <i key={t} />
          ))}
        </div>
        <div className="chart-cols">
          {points.map((p, i) => {
            const edge =
              i < points.length * 0.15
                ? " edge-l"
                : i > points.length * 0.85
                  ? " edge-r"
                  : "";
            return (
              <div
                key={p.label + i}
                className={`chart-col${edge}`}
                tabIndex={0}
              >
                <div
                  className="chart-bar"
                  style={{ height: `${max ? (p.value / max) * 100 : 0}%` }}
                />
                <div className="chart-tip" role="tooltip">
                  <b>{p.tip}</b>
                  <span>
                    {unit === "₮" ? formatMNT(p.value) : `${p.value} ${unit}`}
                  </span>
                  {p.sub && <span>{p.sub}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-x">
          {points.map((p, i) => (
            <span key={p.label + i}>{i % tickEvery === 0 ? p.label : ""}</span>
          ))}
        </div>
        {empty && <p className="chart-empty">Энэ хугацаанд захиалга байхгүй</p>}
      </div>
    </div>
  );
}

// Хэвтээ баганууд: бараа бүр нэг мөр, утга нь мөрийн төгсгөлд текстээр
export function BarList({ items }: { items: TopProduct[] }) {
  const max = Math.max(1, ...items.map((i) => i.revenue));
  if (!items.length)
    return (
      <p className="chart-empty static">
        Энэ хугацаанд борлуулсан бараа байхгүй
      </p>
    );
  return (
    <ol className="bar-list">
      {items.map((it, idx) => (
        <li key={(it.id ?? it.name) + idx} tabIndex={0}>
          <span className="bar-name" title={it.name}>
            {it.name}
          </span>
          <span className="bar-track">
            <span
              className="bar-fill"
              style={{ width: `${(it.revenue / max) * 100}%` }}
            />
          </span>
          <span className="bar-value">{formatMNT(it.revenue)}</span>
          <div className="chart-tip" role="tooltip">
            <b>{it.name}</b>
            <span>
              {it.qty} ширхэг · {formatMNT(it.revenue)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

const STATUS_ICON: Record<StatusGroup["key"], string> = {
  done: "✓",
  active: "◔",
  cancelled: "✕",
};

// Захиалгын байдал: нэг хэвтээ давхар багана + дүрс, нэр, тоотой тайлбар (статусын өнгө зөвхөн энд)
export function StatusBar({ groups }: { groups: StatusGroup[] }) {
  const total = groups.reduce((s, g) => s + g.count, 0);
  if (!total)
    return <p className="chart-empty static">Энэ хугацаанд захиалга байхгүй</p>;
  return (
    <div className="status-chart">
      <div
        className="status-track"
        role="img"
        aria-label={groups.map((g) => `${g.label} ${g.count}`).join(", ")}
      >
        {groups
          .filter((g) => g.count > 0)
          .map((g) => (
            <span
              key={g.key}
              className={`status-seg ${g.key}`}
              style={{ flexGrow: g.count }}
            />
          ))}
      </div>
      <ul className="status-legend">
        {groups.map((g) => (
          <li key={g.key}>
            <span className={`status-dot ${g.key}`} aria-hidden>
              {STATUS_ICON[g.key]}
            </span>
            <span>{g.label}</span>
            <b>{g.count}</b>
            <span className="muted">
              {Math.round((g.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
