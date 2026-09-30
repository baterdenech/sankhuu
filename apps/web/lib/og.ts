// Open Graph зургийн туслахууд (next/og ImageResponse): кирилл фонт ачаалах, холбоосыг бүтэн болгох, текст богиносгох

export const OG_SIZE = { width: 1200, height: 630 };
export const BRAND = "#ff6f0f";
export const BRAND_DARK = "#e85d04";

// Хуучин browser-ийн User-Agent-аар Google Fonts TTF (Satori woff2 дэмждэггүй) буцаадаг
const UA = "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";
const cache = new Map<number, Promise<ArrayBuffer | null>>();

export function loadInter(weight: 400 | 700): Promise<ArrayBuffer | null> {
  const cached = cache.get(weight);
  if (cached) return cached;
  const p: Promise<ArrayBuffer | null> = (async () => {
    try {
      const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`, { headers: { "User-Agent": UA } }).then((r) => r.text());
      const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
      if (!url) return null;
      return await fetch(url).then((r) => r.arrayBuffer());
    } catch {
      return null; // сүлжээгүй бол Satori-гийн анхдагч фонт (кирилл дутуу байж болно)
    }
  })();
  cache.set(weight, p);
  return p;
}

export async function ogFonts() {
  const [regular, bold] = await Promise.all([loadInter(400), loadInter(700)]);
  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[] = [];
  if (regular) fonts.push({ name: "Inter", data: regular, weight: 400, style: "normal" });
  if (bold) fonts.push({ name: "Inter", data: bold, weight: 700, style: "normal" });
  return fonts;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://erp.flexlink.mn")).replace(/\/$/, "");
}

// Харьцангуй зам (/uploads/…) бол бүтэн URL болгоно
export function absoluteImage(src: string | null | undefined) {
  if (!src) return null;
  return /^https?:\/\//i.test(src) ? src : `${siteUrl()}${src.startsWith("/") ? "" : "/"}${src}`;
}

export function clip(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

export function mnt(n: number) {
  return `${n.toLocaleString("en-US")}₮`;
}
