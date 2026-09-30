import Link from "next/link";
import { formatMNT, orderStatusLabel } from "@/lib/labels";
import { STATS_PRESETS, type Kpi, type SellerStats } from "@/lib/stats";
import { BarList, ColumnChart, StatusBar } from "./charts";

// Статистикийн дэлгэц: хугацааны шүүлтүүр → гол үзүүлэлт → графикууд (бүгд хүснэгтээр ч харагдана)
export function StatsView({ s, days }: { s: SellerStats; days: number }) {
  const tickEvery = days <= 7 ? 1 : days <= 30 ? 5 : 15;

  const kpis: { label: string; kpi: Kpi; fmt: (n: number) => string }[] = [
    { label: "Борлуулалт", kpi: s.revenue, fmt: formatMNT },
    { label: "Захиалга", kpi: s.orders, fmt: String },
    { label: "Дундаж захиалга", kpi: s.avgOrder, fmt: formatMNT },
    { label: "Хүргэгдсэн хувь", kpi: s.deliveredRate, fmt: (n) => `${n}%` },
  ];

  return (
    <>
      <div className="page-head">
        <h1>Статистик</h1>
        <div className="actions">
          <Link href="/orders" className="btn">
            Захиалгууд
          </Link>
        </div>
      </div>

      <div className="stats-filters" role="group" aria-label="Хугацаа">
        {STATS_PRESETS.map((d) => (
          <Link
            key={d}
            href={`/stats?days=${d}`}
            className={`chip${d === days ? " on" : ""}`}
            aria-current={d === days ? "true" : undefined}
          >
            {d} хоног
          </Link>
        ))}
        <span className="muted small-text">
          {s.from} – {s.to} · цуцлагдсан захиалгыг борлуулалтад тооцохгүй
        </span>
      </div>

      <div className="cards stats-kpis">
        {kpis.map(({ label, kpi, fmt }) => (
          <div key={label} className="card">
            <div className="label">{label}</div>
            <div className="value">{fmt(kpi.value)}</div>
            <Delta kpi={kpi} days={days} />
          </div>
        ))}
      </div>

      <section className="card chart-card">
        <header>
          <h2>Өдөр тутмын борлуулалт</h2>
          <span className="muted small-text">₮, захиалга үүссэн өдрөөр</span>
        </header>
        <ColumnChart
          points={s.daily.map((d) => ({
            label: d.label,
            value: d.revenue,
            tip: d.key,
            sub: `${d.orders} захиалга`,
          }))}
          unit="₮"
          tickEvery={tickEvery}
        />
        {s.orders.value > 0 && (
          <details>
            <summary>Хүснэгтээр харах</summary>
            <table className="table">
              <thead>
                <tr>
                  <th>Огноо</th>
                  <th>Захиалга</th>
                  <th>Борлуулалт</th>
                </tr>
              </thead>
              <tbody>
                {s.daily
                  .filter((d) => d.orders > 0)
                  .map((d) => (
                    <tr key={d.key}>
                      <td>{d.key}</td>
                      <td className="num">{d.orders}</td>
                      <td className="num">{formatMNT(d.revenue)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </details>
        )}
      </section>

      <div className="stats-grid">
        <section className="card chart-card">
          <header>
            <h2>Гарагаар</h2>
            <span className="muted small-text">
              Захиалгын тоо, долоо хоногийн өдрөөр
            </span>
          </header>
          <ColumnChart
            points={s.weekday.map((w) => ({
              label: w.label,
              value: w.orders,
              tip: w.label,
              sub: formatMNT(w.revenue),
            }))}
            unit="захиалга"
            formatValue={String}
          />
          {s.orders.value > 0 && (
            <details>
              <summary>Хүснэгтээр харах</summary>
              <table className="table">
                <thead>
                  <tr>
                    <th>Гараг</th>
                    <th>Захиалга</th>
                    <th>Борлуулалт</th>
                  </tr>
                </thead>
                <tbody>
                  {s.weekday.map((w) => (
                    <tr key={w.label}>
                      <td>{w.label}</td>
                      <td className="num">{w.orders}</td>
                      <td className="num">{formatMNT(w.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </section>

        <section className="card chart-card">
          <header>
            <h2>Захиалгын байдал</h2>
            <span className="muted small-text">
              Нийт {s.orders.value} захиалга
            </span>
          </header>
          <StatusBar groups={s.status} />
          {s.orders.value > 0 && (
            <details>
              <summary>Хүснэгтээр харах</summary>
              <table className="table">
                <thead>
                  <tr>
                    <th>Статус</th>
                    <th>Тоо</th>
                  </tr>
                </thead>
                <tbody>
                  {s.status.flatMap((g) =>
                    g.statuses.map((r) => (
                      <tr key={r.status}>
                        <td>{orderStatusLabel[r.status]}</td>
                        <td className="num">{r.count}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </details>
          )}
          {s.rating.count > 0 && (
            <p className="muted small-text" style={{ margin: "12px 0 0" }}>
              Үнэлгээ: ★ {s.rating.avg} ({s.rating.count} үнэлгээ)
            </p>
          )}
        </section>
      </div>

      <section className="card chart-card">
        <header>
          <h2>Эрэлттэй бараа</h2>
          <span className="muted small-text">
            Борлуулалтын дүнгээр, эхний {s.top.length}
          </span>
        </header>
        <BarList items={s.top} />
        {s.top.length > 0 && (
          <details>
            <summary>Хүснэгтээр харах</summary>
            <table className="table">
              <thead>
                <tr>
                  <th>Бараа</th>
                  <th>Ширхэг</th>
                  <th>Борлуулалт</th>
                </tr>
              </thead>
              <tbody>
                {s.top.map((t, i) => (
                  <tr key={(t.id ?? t.name) + i}>
                    <td>
                      {t.id ? (
                        <Link href={`/products/${t.id}`}>{t.name}</Link>
                      ) : (
                        t.name
                      )}
                    </td>
                    <td className="num">{t.qty}</td>
                    <td className="num">{formatMNT(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </section>
    </>
  );
}

// Өмнөх ижил хугацаатай харьцуулсан өөрчлөлт: дүрс + текст (өнгө дангаараа утга илэрхийлэхгүй)
function Delta({ kpi, days }: { kpi: Kpi; days: number }) {
  if (kpi.delta === null)
    return <div className="delta muted">Өмнөх {days} хоногт өгөгдөлгүй</div>;
  const cls = kpi.delta > 0 ? "up" : kpi.delta < 0 ? "down" : "";
  const icon = kpi.delta > 0 ? "▲" : kpi.delta < 0 ? "▼" : "•";
  return (
    <div className={`delta ${cls}`}>
      <span aria-hidden>{icon}</span> {Math.abs(kpi.delta)}%{" "}
      <span className="muted">өмнөх {days} хоногоос</span>
    </div>
  );
}
