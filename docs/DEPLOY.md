# Deploy: Supabase + Vercel

## 1. Supabase (мэдээллийн сан)

1. [supabase.com](https://supabase.com) дээр шинэ project үүсгэнэ. Нууц үгээ хадгалж аваарай.
   Region-оо Монголд ойр сонгоно: **Northeast Asia (Seoul/Tokyo)** эсвэл **Southeast Asia (Singapore)**.
2. Project → **Connect** товч дарж холболтын 2 мөрийг хуулна:
   - **Transaction pooler** (порт `6543`) нь `DATABASE_URL`: апп ажиллах үед хэрэглэнэ
   - **Session pooler** (порт `5432`) нь `DIRECT_URL`: migration хийхэд хэрэглэнэ

   `[YOUR-PASSWORD]`-ийн оронд 1-р алхамд үүсгэсэн нууц үгээ бичнэ.
3. Хүснэгтүүдийг үүсгэнэ. Доорх хоёр аргын аль нэгийг сонгоно:
   - **Компьютерээсээ:** `.env` файлд хоёр URL-аа бичээд `pnpm install && pnpm db:deploy`
   - **Компьютергүйгээр:** Supabase → **SQL Editor** руу `packages/db/prisma/migrations/` доторх хавтас бүрийн
     `migration.sql`-ийг **дарааллаар нь** (`0_init`, `1_supabase_auth`, …) хуулж буулгаад **Run** дарна.
     Энэ аргаар хийсэн бол дараа нь компьютерээсээ migration бүрийг хийгдсэн гэж тэмдэглэнэ:
     `pnpm --filter @sankhuu/db exec prisma migrate resolve --applied 0_init` (бусад migration-д мөн адил)

> Migration бүх хүснэгтэд **RLS** идэвхжүүлдэг. Ингэснээр Supabase-ийн нээлттэй API (anon key)-аар
> худалдан авагчийн утас, хаяг зэрэг мэдээлэл харагдахгүй. Апп мэдээллийн сантай зөвхөн серверээс Prisma-аар холбогдоно.

## 2. Supabase Auth (утсаар нэвтрэх)

1. **Authentication → Sign In / Providers → Phone** хэсгийг идэвхжүүлнэ.
2. SMS илгээх үйлчилгээ сонгоно: Twilio, Twilio Verify, MessageBird, Vonage эсвэл Textlocal.
   Монголын дугаар руу илгээх үнийг тухайн үйлчилгээн дээр шалгаарай.
3. **Туршилтад:** мөн тэр Phone тохиргооны **Test Phone Numbers and OTPs** хэсэгт жишээ нь `97699112233=123456` гэж нэмнэ.
   Тэр дугаар руу жинхэнэ SMS явахгүй бөгөөд `123456` кодоор нэвтэрнэ.
   Энэ тохиргоог production-д устгахаа мартуузай.
4. **Authentication → URL Configuration → Site URL**-д `https://erp.flexlink.mn` гэж бичнэ.
5. **Project Settings → API Keys** хэсгээс Project URL болон **Publishable key**-ийг хуулж авна.

## 3. Vercel (веб апп)

1. [vercel.com/new](https://vercel.com/new) → GitHub-аас `sankhuu` repo-г **Import** хийнэ.
2. Тохиргоо:
   - **Root Directory:** `apps/web`. Энэ нь заавал хийх тохиргоо.
   - Framework: Next.js (автоматаар танина), Install/Build командыг өөрчлөхгүй.
3. **Environment Variables** хэсэгт нэмнэ:
   - `DATABASE_URL`: Transaction pooler URL (порт 6543)
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://[PROJECT_REF].supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Publishable key (эсвэл anon key)
4. **Deploy** дарна.

5. **Домэйн (`erp.flexlink.mn`):** Нэг домэйн нэг л Vercel project-д холбогдож чадна. DNS аль хэдийн Vercel рүү заасан тул DNS-д хүрэх шаардлагагүй.
   - Хуучин project → **Settings → Domains** → `erp.flexlink.mn` → **Remove** дарна. Project өөрөө устахгүй.
   - `sankhuu` project → **Settings → Domains** → **Add** дарж `erp.flexlink.mn`-г нэмнэ. Хэдэн минутын дотор SSL-тэй ажиллаж эхэлнэ.

Үүний дараа:
- `main` branch руу push хийх бүрт production автоматаар шинэчлэгдэнэ.
- Бусад branch болон PR бүрт тусдаа **Preview** холбоос үүснэ.

## Схем өөрчлөх үед

```bash
# 1. packages/db/prisma/schema.prisma-г засна
# 2. Локал DB дээр migration үүсгэнэ (docker compose up -d)
pnpm db:migrate --name <тайлбар>
# 3. Бүх шинэ хүснэгтэд RLS нэмнэ (migration.sql-ийн төгсгөлд):
#    ALTER TABLE "ШинэХүснэгт" ENABLE ROW LEVEL SECURITY;
# 4. Supabase руу хэрэгжүүлнэ
DIRECT_URL=... pnpm db:deploy
```
