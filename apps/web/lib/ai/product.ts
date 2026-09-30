import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

export { PRODUCT_CATEGORIES } from "@/lib/categories";

const ProductDraft = z.object({
  name: z.string().describe("Барааны товч, борлуулалтад тохирсон нэр (монголоор, 60 тэмдэгт хүртэл)"),
  description: z
    .string()
    .describe("Худалдан авагчид зориулсан 1-3 өгүүлбэр тайлбар: материал, өнгө, онцлог, хэмжээ (монголоор)"),
  category: z.enum(PRODUCT_CATEGORIES),
  colors: z.array(z.string()).describe("Зурагт харагдаж буй өнгөнүүд, монголоор"),
  suggestedPriceMnt: z
    .number()
    .nullable()
    .describe("Монголын зах зээл дээрх ойролцоо жижиглэнгийн үнэ төгрөгөөр; мэдэхгүй бол null"),
});
export type ProductDraft = z.infer<typeof ProductDraft>;

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM = `Чи Монголын онлайн худалдааны платформын туслах.
Худалдагчийн илгээсэн барааны зургийг хараад барааны бүртгэлийг монгол хэлээр (кирилл) бөглөнө.
Нэр нь товч бөгөөд хайлтад амар байх ёстой (жишээ: "Эмэгтэй ноосон цамц, шаргал").
Тайлбар нь худалдан авагчид хэрэгтэй мэдээллийг л агуулна, хэтрүүлсэн магтаал бичихгүй.
Зураг дээр үнэ, размер, брэнд бичигдсэн бол түүнийг ашиглана. Таамаглаж болохгүй зүйлийг орхино.`;

// Зурагнаас барааны нэр, тайлбар, ангиллыг гаргана. API key байхгүй бол null.
export async function analyzeProductImage(image: Buffer, mediaType: string, hint?: string) {
  if (!aiEnabled()) return null;
  if (mediaType !== "image/jpeg" && mediaType !== "image/png" && mediaType !== "image/webp") return null;

  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 2048,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: { effort: "low", format: betaZodOutputFormat(ProductDraft) },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image.toString("base64") } },
          {
            type: "text",
            text: hint
              ? `Энэ барааг бүртгэ. Худалдагчийн нэмэлт тайлбар: ${hint}`
              : "Энэ барааг бүртгэ.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}
