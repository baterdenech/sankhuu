"use server";

import { redirect } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { uploadImage } from "@/lib/storage";

export type ReviewState = { error?: string; values?: Record<string, string> };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// Захиалгын дугаар + утас (төхөөрөмж дээр хадгалагдсан) таарч, захиалга хүргэгдсэн бол үнэлгээ авна
export async function submitReview(_prev: ReviewState, fd: FormData): Promise<ReviewState> {
  const number = Number(str(fd, "n"));
  const phone = str(fd, "phone");
  const productId = str(fd, "product");
  const rating = Number(str(fd, "rating"));
  const comment = str(fd, "comment").slice(0, 1000);
  const values = { rating: String(rating || ""), comment };
  const fail = (error: string): ReviewState => ({ error, values });

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("Одоо сонгоно уу.");

  const order = await prisma.order.findFirst({
    where: { number, customer: { phone }, status: "DELIVERED", items: { some: { productId } } },
    include: { customer: true },
  });
  if (!order) return fail("Зөвхөн хүргэгдсэн захиалгын бараанд үнэлгээ өгнө.");
  const dup = await prisma.review.findUnique({ where: { orderId_productId: { orderId: order.id, productId } } });
  if (dup) return fail("Энэ бараанд аль хэдийн үнэлгээ өгсөн байна.");

  const images: string[] = [];
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      images.push(await uploadImage(file, `reviews/${order.shopId}`));
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Зураг хадгалж чадсангүй.");
    }
  }

  await prisma.$transaction([
    prisma.review.create({
      data: { productId, orderId: order.id, shopId: order.shopId, rating, comment: comment || null, images, customerName: order.customer.name },
    }),
    prisma.product.update({ where: { id: productId }, data: { ratingCount: { increment: 1 }, ratingSum: { increment: rating } } }),
  ]);

  redirect(`/me?reviewed=${encodeURIComponent(productId)}`);
}
