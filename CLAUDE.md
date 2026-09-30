# CLAUDE.md

## Төсөл
Sankhuu нь бие даасан онлайн худалдааны платформ (marketplace): худалдагч бараагаа AI-ийн тусламжтай бүртгэнэ, худалдан авагч нэг дороос хайж захиална, хүргэлтийг Sankhuu өөрийн жолоочоор гүйцэтгэнэ. Facebook-тэй хамааралгүй; UI болон баримт бичигт Facebook-ийг дурдахгүй.
Одоо 1-р шат хөгжүүлж байна (docs/ROADMAP.md).

## Бүтэц
- pnpm + Turborepo monorepo
- `packages/db`: Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`). Client-ийг `packages/db/src/generated/`-д үүсгэдэг бөгөөд git-д ордоггүй.
- `apps/web`: Next.js 16 App Router. `@sankhuu/db`-ээс `prisma` болон төрлүүдийг импортлоно.

## Deploy
- Supabase (Postgres) + Vercel (Root Directory: `apps/web`). docs/DEPLOY.md
- `DATABASE_URL` нь Supabase transaction pooler (6543) бөгөөд апп ажиллах үед хэрэглэгдэнэ. `DIRECT_URL` нь session pooler (5432) бөгөөд migration-д хэрэглэгдэнэ.
- `packages/db`-ийн `postinstall` нь Prisma client-ийг үүсгэнэ (Vercel build-д хэрэгтэй).

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
- Нэвтрэлтийг Supabase Auth хариуцна: утас + SMS OTP, эсвэл нэвтрэх нэр + нууц үг (`lib/username.ts`: username ↔ `username@login.sankhuu.mn` техникийн имэйл; Supabase дээр Confirm email унтраалттай байх ёстой). `User.id` = Supabase `auth.users.id`; `phone`, `username` хоёулаа optional/unique. Утсыг E.164 (`+976…`) хэлбэрээр хадгална (`apps/web/lib/phone.ts`).
- Хуудас / Server Action-д хэрэглэгчийг `requireUser()` (`apps/web/lib/auth.ts`)-ээр авна. `apps/web/proxy.ts` session-ийг шинэчилж, нэвтрээгүй бол `/login` руу шилжүүлнэ.
- `/` нь харилцагчийн нээлттэй нүүр (бүх дэлгүүрийн бараа, хайлт); худалдагчийн самбар `/dashboard`. Нэвтэрсний дараа `/dashboard` руу шилжүүлнэ.
- Хамгаалагдсан хуудсууд `app/(dashboard)/` дотор байрлана. Тэнд `requireShop()` (`apps/web/lib/shop.ts`) ашиглана: дэлгүүргүй хэрэглэгчийг `/onboarding` руу шилжүүлнэ.
- Барааны зураг: `apps/web/lib/storage.ts` → Supabase Storage (`SUPABASE_SECRET_KEY`), локалд `.uploads/` + `app/uploads/[...path]/route.ts`. Клиент дээр `compress-image.ts` 1280px болгож багасгадаг.
- AI: `apps/web/lib/ai/product.ts` — `@anthropic-ai/sdk`, `claude-opus-5-5`, structured output (zod). `ANTHROPIC_API_KEY` байхгүй бол `aiEnabled()` false буцааж UI гараар ажиллана.
- Server Action-аас алдаа буцаахдаа оруулсан утгуудыг (`values`) хамт буцаана: React 19 форм reset хийдэг тул талбарууд хоосорно. `<select>`-д `key` өгнө.
- Хажуугийн цэсний "Гарах" ч `type=submit` тул тестэд формын товчийг `.product-form button[type=submit]` гэх мэтээр нарийн сонгоно.
- Худалдан авагчийн нээлттэй хуудсууд `app/s/[slug]/` дотор: нэвтрэлт шаардахгүй (`proxy.ts` matcher `s/`-г алгасдаг). Сагс `cart-store.ts` (localStorage, дэлгүүр тус бүрээр). Захиалга `placeOrder` нэг transaction дотор үлдэгдэл хасаж (`stock >= qty` нөхцөлтэй), Customer/Address/Order/Delivery(PENDING)+DeliveryEvent үүсгэнэ.
- Захиалгын статусын шилжилтийг `app/(dashboard)/orders/actions.ts`-ийн `ALLOWED` хүснэгтээр хязгаарлана. Цуцлахад үлдэгдлийг буцаана.
- Шинэ хүснэгт нэмэх бүрт migration SQL-ийн төгсгөлд `ALTER TABLE "..." ENABLE ROW LEVEL SECURITY;` нэмнэ (Supabase Data API-аас хаах).
- Мэдээллийн сантай зөвхөн серверээс (Server Component / Server Action / Route Handler) Prisma-аар холбогдоно. Supabase anon key-ээр хүснэгт рүү хандахгүй.
