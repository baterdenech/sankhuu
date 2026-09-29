# CLAUDE.md

## Төсөл
Sankhuu нь Facebook худалдагчдад зориулсан захиалга ба хүргэлтийн систем. Хүргэлтийг өөрийн жолоочоор гүйцэтгэнэ.
Одоо 1-р шат хөгжүүлж байна (docs/ROADMAP.md).

## Бүтэц
- pnpm + Turborepo monorepo
- `packages/db`: Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`). Client-ийг `packages/db/src/generated/`-д үүсгэдэг бөгөөд git-д ордоггүй.
- `apps/web`: Next.js 16 App Router. `@sankhuu/db`-ээс `prisma` болон төрлүүдийг импортлоно.

## Командууд
- `pnpm install`
- `pnpm db:generate`: схем өөрчилсний дараа заавал ажиллуулна
- `pnpm typecheck` ба `pnpm build`: commit хийхээс өмнө ажиллуулна
- `pnpm --filter @sankhuu/db exec prisma validate`

## Дүрэм
- Мөнгөн дүнг `Int` төгрөгөөр хадгална. Float хэрэглэхгүй.
- UI текст монгол хэлээр (кирилл) бичигдэнэ. Enum-ийн монгол нэр `apps/web/lib/labels.ts`-д байна.
- Захиалгын мөрөнд (`OrderItem`) барааны нэр, үнийг захиалах үеийнхээр хадгална.
- Хүргэлтийн статус өөрчлөгдөх бүрт `DeliveryEvent` бичнэ.
- Нэвтрэлт утасны дугаар + SMS OTP-оор хийгдэнэ (`OtpCode`). Кодыг hash хэлбэрээр хадгална.
