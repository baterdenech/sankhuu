import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { prisma, type Prisma } from "@sankhuu/db";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { aiEnabled } from "./product";

// ─── Худалдан авагчийн AI туслах ─────────────────────────────────────────────
// Чат нь Claude-ийн tool use-ээр бараа хайж (search_products), нэг барааны дэлгэрэнгүйг (get_product) авч,
// зөвхөн олдсон бараанаас санал болгоно. Дэлгүүрийн хуудсанд тухайн дэлгүүрээр хязгаарлана.
// ANTHROPIC_API_KEY байхгүй бол `keywordFallback` энгийн хайлтаар хариулна (AI-гүй горим).

export const MAX_TURNS = 12; // клиентээс ирэх түүхийн дээд хэмжээ (user+assistant)
export const MAX_MESSAGE_CHARS = 600;
const MAX_TOOL_ROUNDS = 4;

export type AssistantProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  category: string | null;
  stock: number;
  ratingCount: number;
  ratingSum: number;
  shopSlug: string;
  shopName: string;
};

export type AssistantContext = { shopSlug?: string; productId?: string };

// Стриймээр клиент рүү явах мөрүүд (NDJSON)
export type AssistantEvent =
  | { t: "text"; d: string }
  | { t: "products"; items: AssistantProduct[] }
  | { t: "status"; d: string }
  | { t: "done" }
  | { t: "error"; d: string };

const SearchInput = z.object({
  query: z.string().max(120).optional().describe("Барааны нэр, тайлбар, дэлгүүрийн нэрээс хайх түлхүүр үг (монголоор). Ерөнхий хүсэлтэд хоосон орхиж болно."),
  category: z.enum(PRODUCT_CATEGORIES).optional().describe("Ангиллаар шүүх"),
  maxPrice: z.number().int().positive().optional().describe("Дээд үнэ, төгрөгөөр"),
  minPrice: z.number().int().positive().optional().describe("Доод үнэ, төгрөгөөр"),
  onSale: z.boolean().optional().describe("Зөвхөн хямдралтай бараа"),
  sort: z.enum(["popular", "cheap", "pricey", "new"]).optional().describe("Эрэмбэ: popular (анхдагч), cheap, pricey, new"),
  limit: z.number().int().min(1).max(8).optional(),
});
const GetProductInput = z.object({ productId: z.string().max(64) });

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_products",
    description:
      "Sankhuu дээрх бэлэн (үлдэгдэлтэй) барааг хайна. Хэрэглэгч бараа, бэлэг, зөвлөгөө асуувал заавал эхлээд үүгээр хай. Хэд хэдэн өөр түлхүүр үгээр дахин хайж болно. Үр дүн хоосон бол ангилал эсвэл үнийн хязгаарыг сулруулж дахин хай.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Түлхүүр үг (монголоор), заавал биш" },
        category: { type: "string", enum: [...PRODUCT_CATEGORIES], description: "Ангилал" },
        maxPrice: { type: "integer", description: "Дээд үнэ ₮" },
        minPrice: { type: "integer", description: "Доод үнэ ₮" },
        onSale: { type: "boolean", description: "Зөвхөн хямдралтай" },
        sort: { type: "string", enum: ["popular", "cheap", "pricey", "new"] },
        limit: { type: "integer", minimum: 1, maximum: 8 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_product",
    description: "Нэг барааны бүрэн мэдээлэл (тайлбар, үлдэгдэл, үнэлгээ, сүүлийн сэтгэгдлүүд, дэлгүүрийн байршил). Хэрэглэгч тодорхой нэг барааны талаар асуувал ашигла.",
    input_schema: {
      type: "object",
      properties: { productId: { type: "string" } },
      required: ["productId"],
      additionalProperties: false,
    },
  },
];

const publicWhere: Prisma.ProductWhereInput = { isActive: true, shop: { isActive: true } };

function toCard(p: {
  id: string; name: string; price: number; compareAtPrice: number | null; images: string[]; category: string | null; stock: number; ratingCount: number; ratingSum: number;
  shop: { slug: string; name: string };
}): AssistantProduct {
  return { id: p.id, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice, image: p.images[0] ?? null, category: p.category, stock: p.stock, ratingCount: p.ratingCount, ratingSum: p.ratingSum, shopSlug: p.shop.slug, shopName: p.shop.name };
}

export async function searchProducts(input: z.infer<typeof SearchInput>, ctx: AssistantContext) {
  const q = input.query?.trim();
  const words = q ? q.split(/\s+/).filter((w) => w.length > 1).slice(0, 5) : [];
  const where: Prisma.ProductWhereInput = {
    ...publicWhere,
    stock: { gt: 0 },
    ...(ctx.shopSlug ? { shop: { slug: ctx.shopSlug, isActive: true } } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.maxPrice || input.minPrice ? { price: { ...(input.maxPrice ? { lte: input.maxPrice } : {}), ...(input.minPrice ? { gte: input.minPrice } : {}) } } : {}),
    ...(input.onSale ? { compareAtPrice: { not: null } } : {}),
    ...(words.length
      ? { OR: words.flatMap((w) => [{ name: { contains: w, mode: "insensitive" as const } }, { description: { contains: w, mode: "insensitive" as const } }, { shop: { name: { contains: w, mode: "insensitive" as const } } }]) }
      : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    input.sort === "cheap" ? [{ price: "asc" }] : input.sort === "pricey" ? [{ price: "desc" }] : input.sort === "new" ? [{ createdAt: "desc" }] : [{ ratingCount: "desc" }, { createdAt: "desc" }];
  let rows = await prisma.product.findMany({ where, include: { shop: { select: { slug: true, name: true } } }, orderBy, take: input.limit ?? 6 });
  if (input.onSale) rows = rows.filter((p) => (p.compareAtPrice ?? 0) > p.price);
  return rows.map(toCard);
}

async function getProduct(productId: string, ctx: AssistantContext) {
  const p = await prisma.product.findFirst({
    where: { id: productId, ...publicWhere, ...(ctx.shopSlug ? { shop: { slug: ctx.shopSlug, isActive: true } } : {}) },
    include: { shop: { select: { slug: true, name: true, pickupAddress: { select: { district: true } } } }, reviews: { orderBy: { createdAt: "desc" }, take: 5, select: { rating: true, comment: true } } },
  });
  if (!p) return null;
  return {
    ...toCard(p),
    description: p.description,
    district: p.shop.pickupAddress?.district ?? null,
    reviews: p.reviews,
  };
}

function money(n: number) {
  return `${n.toLocaleString("en-US")}₮`;
}

function systemPrompt(ctx: { shopName?: string; productName?: string }) {
  return `Чи Sankhuu онлайн худалдааны платформын худалдан авагчийн туслах. Монгол хэлээр (кирилл), найрсаг, товч хариулна.
${ctx.shopName ? `Одоо хэрэглэгч "${ctx.shopName}" дэлгүүрийн хуудсан дээр байгаа: зөвхөн энэ дэлгүүрийн барааг санал болго (хайлт аль хэдийн энэ дэлгүүрээр хязгаарлагдсан).` : "Хэрэглэгч Sankhuu-гийн нүүр хэсэгт байгаа: бүх дэлгүүрийн бараанаас хай."}
${ctx.productName ? `Хэрэглэгч одоо "${ctx.productName}" барааг үзэж байна; "энэ бараа" гэвэл түүнийг хэлж байна.` : ""}

Дүрэм:
- Бараа санал болгохын өмнө заавал search_products-оор хай. Хайлтын үр дүнд байхгүй барааг зохиож болохгүй. Олдохгүй бол шууд хэлж, өөр түлхүүр үг эсвэл ангилал санал болго.
- Санал болгосон бараа бүрийг товч тайлбарла (яагаад тохирох вэ, үнэ). Бараа өөрсдөө карт болж харагдах тул нэр, үнийг давтаж урт жагсаалт бичих шаардлагагүй: 1-3 өгүүлбэр, эсвэл богино жагсаалт.
- Үнийг ₮ тэмдэгтэй, мянгатын таслалтай бич (жишээ: 45,000₮).
- Хүргэлт: Улаанбаатар хотод, 15:00-с өмнө захиалбал маргааш, дараа нь нөгөөдөр; хүргэлтийн хөлс дүүргээр 5,000₮-с; төлбөрийг бараагаа хүлээж авахдаа жолоочид бэлнээр эсвэл шилжүүлгээр төлнө. Хөдөө орон нутагт одоогоор хүргэлт хийхгүй.
- Захиалахын тулд барааны хуудаснаас "Сагсанд нэмэх" эсвэл "Шууд захиалах" дарна; бүртгэл шаардахгүй, нэр, утас, хаяг л хэрэгтэй.
- Хэрэглэгчийн хүсэлт тодорхойгүй бол (хэнд, төсөв, зориулалт) нэг богино асуулт асуу; гэхдээ боломжтой бол эхлээд хайж, дараа нь асуу.
- Sankhuu-тэй хамааралгүй сэдвээр урт ярихгүй; худалдаа, бараа, хүргэлт рүү эелдгээр эргүүл.
- Markdown толгой, хүснэгт хэрэглэхгүй; энгийн текст, хамгийн ихдээ богино жагсаалт.`;
}

// ─── Стриймтэй үндсэн урсгал ────────────────────────────────────────────────
export async function* runAssistant(history: Anthropic.Beta.BetaMessageParam[], ctx: AssistantContext): AsyncGenerator<AssistantEvent> {
  const [shop, product] = await Promise.all([
    ctx.shopSlug ? prisma.shop.findFirst({ where: { slug: ctx.shopSlug, isActive: true }, select: { name: true } }) : null,
    ctx.productId ? prisma.product.findFirst({ where: { id: ctx.productId, ...publicWhere }, select: { name: true } }) : null,
  ]);
  if (ctx.shopSlug && !shop) ctx = { ...ctx, shopSlug: undefined };

  if (!aiEnabled()) {
    yield* keywordFallback(history, ctx);
    return;
  }

  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [...history];
  const system = systemPrompt({ shopName: shop?.name, productName: product?.name });
  const seen = new Set<string>();

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const stream = client.beta.messages.stream({
      model: "claude-opus-5-5",
      max_tokens: 1500,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      tools: round < MAX_TOOL_ROUNDS ? TOOLS : [],
      messages,
    });

    // Текстийг ирэх дараалалд нь клиент рүү дамжуулна
    const queue: string[] = [];
    let wake: (() => void) | null = null;
    let finished = false;
    stream.on("text", (delta) => {
      queue.push(delta);
      wake?.();
    });
    const final = stream.finalMessage().then(
      (m) => ((finished = true), wake?.(), m),
      (e) => ((finished = true), wake?.(), Promise.reject(e)),
    );
    while (!finished || queue.length) {
      if (queue.length) {
        yield { t: "text", d: queue.splice(0).join("") };
        continue;
      }
      await new Promise<void>((r) => (wake = r));
      wake = null;
    }
    const message = await final;

    if (message.stop_reason === "refusal") {
      yield { t: "text", d: "Уучлаарай, энэ асуултад хариулж чадахгүй нь. Бараа, хүргэлтийн талаар асуугаарай." };
      break;
    }
    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (message.stop_reason !== "tool_use" || toolUses.length === 0) break;

    messages.push({ role: "assistant", content: message.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      if (tu.name === "search_products") {
        const parsed = SearchInput.safeParse(tu.input);
        if (!parsed.success) {
          results.push({ type: "tool_result", tool_use_id: tu.id, is_error: true, content: "Буруу параметр: " + parsed.error.message });
          continue;
        }
        yield { t: "status", d: parsed.data.query ? `«${parsed.data.query}» хайж байна…` : "Бараа хайж байна…" };
        const items = await searchProducts(parsed.data, ctx);
        const fresh = items.filter((p) => !seen.has(p.id));
        fresh.forEach((p) => seen.add(p.id));
        if (fresh.length) yield { t: "products", items: fresh };
        results.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: items.length
            ? JSON.stringify(items.map((p) => ({ id: p.id, name: p.name, price: money(p.price), compareAtPrice: p.compareAtPrice ? money(p.compareAtPrice) : null, category: p.category, stock: p.stock, rating: p.ratingCount ? `${(p.ratingSum / p.ratingCount).toFixed(1)} (${p.ratingCount})` : null, shop: p.shopName })))
            : "Тохирох бараа олдсонгүй.",
        });
      } else if (tu.name === "get_product") {
        const parsed = GetProductInput.safeParse(tu.input);
        const p = parsed.success ? await getProduct(parsed.data.productId, ctx) : null;
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          const { description: _d, district: _dis, reviews: _r, ...card } = p;
          yield { t: "products", items: [card] };
        }
        results.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: p
            ? JSON.stringify({ ...p, price: money(p.price), compareAtPrice: p.compareAtPrice ? money(p.compareAtPrice) : null, image: undefined })
            : "Бараа олдсонгүй.",
        });
      } else {
        results.push({ type: "tool_result", tool_use_id: tu.id, is_error: true, content: "Ийм хэрэгсэл алга." });
      }
    }
    messages.push({ role: "user", content: results });
  }
}

// AI идэвхгүй үед: сүүлийн хүсэлтээр энгийн хайлт хийж, олдсоныг карт болгон буцаана
async function* keywordFallback(history: Anthropic.Beta.BetaMessageParam[], ctx: AssistantContext): AsyncGenerator<AssistantEvent> {
  const last = [...history].reverse().find((m) => m.role === "user");
  const text = typeof last?.content === "string" ? last.content : "";
  const numbers = text.match(/\d[\d,]*/g)?.map((n) => Number(n.replace(/,/g, ""))) ?? [];
  const maxPrice = /доош|хүртэл|багад|дотор/.test(text) && numbers.length ? Math.max(...numbers) * (/мян|мянга/.test(text) && Math.max(...numbers) < 1000 ? 1000 : 1) : undefined;
  const category = PRODUCT_CATEGORIES.find((c) => text.toLowerCase().includes(c.toLowerCase().split(",")[0]));
  const words = text.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !/^(бараа|хайх|хай|байна|байгаа|юу|вэ|уу|үү|надад|хэрэгтэй|санал|болго)$/i.test(w));
  let items = await searchProducts({ query: words.slice(0, 3).join(" "), category, maxPrice, limit: 6 }, ctx);
  if (items.length === 0 && (category || maxPrice)) items = await searchProducts({ category, maxPrice, limit: 6 }, ctx);
  if (items.length === 0) items = await searchProducts({ limit: 6, sort: "popular" }, ctx);
  yield { t: "text", d: items.length ? "AI туслах одоогоор идэвхгүй тул түлхүүр үгээр хайлаа. Танд тохирч магадгүй бараанууд:" : "Тохирох бараа олдсонгүй. Өөр үгээр хайж үзээрэй." };
  if (items.length) yield { t: "products", items };
}
