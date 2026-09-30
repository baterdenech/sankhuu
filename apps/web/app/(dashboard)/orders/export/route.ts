import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import {
  orderInclude,
  orderWhere,
  ordersToCsv,
  parseOrderQuery,
} from "@/lib/order-query";

// Захиалгын жагсаалтыг (одоогийн шүүлтээр, 2000 хүртэл) CSV болгож татна; Excel шууд нээнэ
export async function GET(req: Request) {
  const { shop } = await requireShop();
  const sp = Object.fromEntries(new URL(req.url).searchParams) as Record<
    string,
    string
  >;
  const orders = await prisma.order.findMany({
    where: orderWhere(shop.id, parseOrderQuery(sp)),
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  const date = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
  return new Response(ordersToCsv(orders), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zahialga-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
