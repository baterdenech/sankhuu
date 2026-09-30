"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ShopInsights } from "@/lib/ai/insights";
import { getInsights } from "./actions";

// Хянах самбарын "AI дүгнэлт" карт: товч дарахад сүүлийн 30 хоногийн борлуулалтыг шинжилнэ
export function Insights() {
  const [data, setData] = useState<ShopInsights | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const load = (force = false) =>
    start(async () => {
      const r = await getInsights(force);
      setFailed(!r);
      setData(r);
    });

  return (
    <section className="card insights">
      <div className="insights-head">
        <div>
          <h2 style={{ margin: 0 }}>AI дүгнэлт, зөвлөгөө</h2>
          <span className="muted small-text">Сүүлийн 30 хоногийн захиалга, бараа, үнэлгээг шинжилнэ</span>
        </div>
        <button type="button" className="btn primary" disabled={pending} onClick={() => load(Boolean(data))}>
          {pending ? "Шинжилж байна…" : data ? "Дахин шинжлэх" : "Зөвлөгөө авах"}
        </button>
      </div>
      {failed && <p className="ai-status warn">AI хариу өгсөнгүй. Хэсэг хугацааны дараа дахин оролдоно уу.</p>}
      {data && (
        <div className="insights-body">
          <p className="insights-summary">{data.summary}</p>
          <div className="insights-cols">
            <div>
              <h3>Ажиглалт</h3>
              <ul>
                {data.insights.map((i, idx) => (
                  <li key={idx}>
                    <strong>{i.title}</strong>
                    <span>{i.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Хийх зүйл</h3>
              <ul>
                {data.actions.map((a, idx) => (
                  <li key={idx}>
                    <strong>{a.productId ? <Link href={`/products/${a.productId}`}>{a.label}</Link> : a.label}</strong>
                    <span>{a.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="muted small-text" style={{ margin: 0 }}>
            {data.stats.orders} захиалга · {data.stats.revenue.toLocaleString("en-US")}₮ · {new Date(data.generatedAt).toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" })}
          </p>
        </div>
      )}
    </section>
  );
}
