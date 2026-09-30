import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { MAX_MESSAGE_CHARS, MAX_TURNS, runAssistant, type AssistantEvent } from "@/lib/ai/assistant";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(MAX_MESSAGE_CHARS) }))
    .min(1)
    .max(MAX_TURNS),
  shopSlug: z.string().max(80).optional(),
  productId: z.string().max(64).optional(),
});

// Худалдан авагчийн AI туслах: NDJSON стрийм (мөр бүр нэг AssistantEvent)
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Буруу хүсэлт" }, { status: 400 });
  const { messages, shopSlug, productId } = parsed.data;
  if (messages[messages.length - 1].role !== "user") return Response.json({ error: "Сүүлийн мессеж хэрэглэгчийнх байх ёстой" }, { status: 400 });

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: AssistantEvent) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      try {
        for await (const ev of runAssistant(messages, { shopSlug, productId })) send(ev);
        send({ t: "done" });
      } catch (e) {
        const msg =
          e instanceof Anthropic.RateLimitError
            ? "Түр завгүй байна, хэсэг хугацааны дараа дахин оролдоно уу."
            : e instanceof Anthropic.APIError
              ? "AI үйлчилгээнд алдаа гарлаа."
              : "Алдаа гарлаа. Дахин оролдоно уу.";
        console.error("assistant", e);
        send({ t: "error", d: msg });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
