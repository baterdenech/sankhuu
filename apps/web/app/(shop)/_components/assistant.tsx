"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AssistantEvent, AssistantProduct } from "@/lib/ai/assistant";
import { ChatIcon, CloseIcon, SendIcon, SparkleIcon } from "./catalog-icons";
import { ProductImage } from "./product-image";
import { discountPct, Stars } from "./product-card";

// ─── Худалдан авагчийн AI туслах (хөвөгч товч + доод sheet) ─────────────────
// Нүүр дээр бүх дэлгүүрээс, /s/[slug] дээр тухайн дэлгүүрээс хайна; /s/[slug]/p/[id] дээр "энэ бараа"-г мэднэ.
// Өөр компонентоос нээх: window.dispatchEvent(new CustomEvent("sankhuu:assistant", { detail: { text?: string } }))

type Msg = { role: "user" | "assistant"; content: string; products?: AssistantProduct[]; status?: string; error?: string };

const SUGGEST_HOME = ["Эмээдээ 50 мянгаас доош бэлэг", "Хамгийн эрэлттэй бараа юу вэ?", "Өвөлд тохирох хувцас", "Хүргэлт хэзээ, хэдээр ирэх вэ?"];
const SUGGEST_SHOP = ["Энэ дэлгүүрт хямдралтай юу байна?", "Хамгийн сайн үнэлгээтэй нь аль вэ?", "50 мянгаас доош юу байна?"];
const SUGGEST_PRODUCT = ["Энэ бараа надад тохирох уу?", "Энэ барааны сэтгэгдэл ямар байна?", "Үүнтэй төстэй хямд бараа"];

export function openAssistant(text?: string) {
  window.dispatchEvent(new CustomEvent("sankhuu:assistant", { detail: { text } }));
}

export function Assistant() {
  const pathname = usePathname();
  const m = pathname.match(/^\/s\/([^/]+)(?:\/p\/([^/]+))?/);
  const shopSlug = m?.[1];
  const productId = m?.[2];
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text;
      setOpen(true);
      if (text) void send(text);
      else setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener("sankhuu:assistant", onOpen);
    return () => window.removeEventListener("sankhuu:assistant", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopSlug, productId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    const history = [...msgs.filter((x) => !x.error), { role: "user" as const, content: t }];
    setMsgs([...history, { role: "assistant", content: "", status: "Бодож байна…" }]);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12).map(({ role, content }) => ({ role, content })), shopSlug, productId }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error("bad response");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      const apply = (ev: AssistantEvent) =>
        setMsgs((cur) => {
          const last = cur[cur.length - 1];
          if (!last || last.role !== "assistant") return cur;
          const next: Msg = { ...last, status: undefined };
          if (ev.t === "text") next.content = last.content + ev.d;
          else if (ev.t === "products") next.products = [...(last.products ?? []), ...ev.items];
          else if (ev.t === "status") next.status = ev.d;
          else if (ev.t === "error") next.error = ev.d;
          return [...cur.slice(0, -1), next];
        });
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) apply(JSON.parse(line) as AssistantEvent);
      }
      if (buf.trim()) apply(JSON.parse(buf) as AssistantEvent);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMsgs((cur) => [...cur.slice(0, -1), { role: "assistant", content: "", error: "Холболт тасарлаа. Дахин оролдоно уу." }]);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const suggestions = productId ? SUGGEST_PRODUCT : shopSlug ? SUGGEST_SHOP : SUGGEST_HOME;
  const title = productId ? "Энэ барааны тухай асуу" : shopSlug ? "Дэлгүүрийн туслах" : "Sankhuu AI туслах";

  return (
    <>
      {!open && (
        <button type="button" className={`ai-fab${productId || pathname === "/cart" ? " raised" : ""}`} onClick={() => setOpen(true)} aria-label="AI туслах нээх">
          <SparkleIcon size={20} />
          <span>Асуух</span>
        </button>
      )}
      {open && (
        <div className="ai-sheet" role="dialog" aria-label={title}>
          <div className="ai-head">
            <span className="ai-avatar">
              <SparkleIcon size={18} />
            </span>
            <div className="ai-head-body">
              <strong>{title}</strong>
              <span className="muted small-text">Бараа хайж, зөвлөгөө өгнө</span>
            </div>
            {msgs.length > 0 && (
              <button type="button" className="link-button small-text" onClick={() => (abortRef.current?.abort(), setMsgs([]))}>
                Шинэ яриа
              </button>
            )}
            <button type="button" className="ai-close" onClick={() => setOpen(false)} aria-label="Хаах">
              <CloseIcon size={22} />
            </button>
          </div>

          <div className="ai-list" ref={listRef}>
            {msgs.length === 0 && (
              <div className="ai-intro">
                <p>Сайн байна уу! Юу хайж байна, хэнд зориулж авах гэж байна, төсөв хэд вэ гэдгээ бичээрэй. Би тохирох барааг олж өгнө.</p>
                <div className="chips">
                  {suggestions.map((s) => (
                    <button key={s} type="button" className="chip" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((mm, i) => (
              <div key={i} className={`ai-msg ${mm.role}`}>
                {mm.content && <div className="ai-bubble">{mm.content}</div>}
                {mm.products && mm.products.length > 0 && (
                  <div className="ai-products">
                    {mm.products.map((p) => (
                      <AssistantProductRow key={p.id} p={p} onOpen={() => setOpen(false)} />
                    ))}
                  </div>
                )}
                {mm.status && <div className="ai-status">{mm.status}</div>}
                {mm.error && <div className="ai-bubble error">{mm.error}</div>}
              </div>
            ))}
            {msgs.length > 0 && !busy && (
              <div className="chips ai-followups">
                {suggestions.slice(0, 2).map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="ai-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <ChatIcon size={20} className="muted" />
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Жишээ: 30 мянгаас доош бэлэг" maxLength={600} enterKeyHint="send" aria-label="Асуулт" />
            <button type="submit" className="ai-send" disabled={busy || !input.trim()} aria-label="Илгээх">
              <SendIcon size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function AssistantProductRow({ p, onOpen }: { p: AssistantProduct; onOpen: () => void }) {
  const pct = discountPct(p.price, p.compareAtPrice);
  return (
    <Link href={`/s/${p.shopSlug}/p/${p.id}`} className="ai-product" onClick={onOpen}>
      <span className="ai-product-media">
        <ProductImage src={p.image ?? undefined} alt="" category={p.category} />
      </span>
      <span className="ai-product-body">
        <span className="ai-product-name">{p.name}</span>
        <span className="ai-product-price">
          {pct > 0 && <span className="discount">{pct}%</span>} <strong>{p.price.toLocaleString("en-US")}₮</strong>
        </span>
        <span className="muted small-text">
          {p.shopName}
          {p.ratingCount > 0 && (
            <>
              {" · "}
              <Stars count={p.ratingCount} sum={p.ratingSum} />
            </>
          )}
        </span>
      </span>
      <span className="chev">›</span>
    </Link>
  );
}
