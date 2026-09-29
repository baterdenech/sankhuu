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
   - **Компьютергүйгээр:** Supabase → **SQL Editor** руу `packages/db/prisma/migrations/0_init/migration.sql`-ийн агуулгыг хуулж буулгаад **Run** дарна.
     Энэ аргаар хийсэн бол дараа нь компьютерээсээ нэг удаа
     `pnpm --filter @sankhuu/db exec prisma migrate resolve --applied 0_init` ажиллуулна. Ингэснээр Prisma энэ migration-ыг хийгдсэн гэж тэмдэглэнэ.

> Migration бүх хүснэгтэд **RLS** идэвхжүүлдэг. Ингэснээр Supabase-ийн нээлттэй API (anon key)-аар
> худалдан авагчийн утас, хаяг зэрэг мэдээлэл харагдахгүй. Апп мэдээллийн сантай зөвхөн серверээс Prisma-аар холбогдоно.

## 2. Vercel (веб апп)

1. [vercel.com/new](https://vercel.com/new) → GitHub-аас `sankhuu` repo-г **Import** хийнэ.
2. Тохиргоо:
   - **Root Directory:** `apps/web`. Энэ нь заавал хийх тохиргоо.
   - Framework: Next.js (автоматаар танина), Install/Build командыг өөрчлөхгүй.
3. **Environment Variables** хэсэгт нэмнэ:
   - `DATABASE_URL`: Transaction pooler URL (порт 6543)
4. **Deploy** дарна.

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
