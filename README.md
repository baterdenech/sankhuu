# Sankhuu

Монголын жижиг дэлгүүр, худалдагчдад зориулсан **онлайн худалдаа + хүргэлтийн** платформ. Худалдагч бараагаа бүртгэнэ, худалдан авагч нэг дороос хайж захиална.
Хүргэлтийг Sankhuu **өөрийн жолоочоор** гүйцэтгэнэ.

Одоо **1-р шат** хөгжүүлж байна: худалдагч захиалгаа бүртгэхэд хүргэлт автоматаар үүснэ, диспетчер түүнийг жолоочид хуваарилна, жолооч хүргээд бэлэн мөнгийг (COD) цуглуулна, дараа нь Sankhuu худалдагчтай тооцоо хийнэ.
Хаягууд: `/` харилцагчийн нүүр (бүх дэлгүүрийн бараа), `/s/<дэлгүүр>` дэлгүүрийн хуудас, `/dashboard` худалдагчийн самбар, `/login` нэвтрэх.
Дэлгэрэнгүйг [docs/ROADMAP.md](docs/ROADMAP.md)-аас харна уу.

## Бүтэц

```
apps/
  web/      Next.js: худалдагч болон диспетчерийн (админ) веб самбар
  driver/   Жолоочийн апп (Expo, төлөвлөгдсөн)
packages/
  db/       Prisma схем болон мэдээллийн сангийн client
```

## Эхлүүлэх

Шаардлага: Node 22+, pnpm 10+, Docker (PostgreSQL-д)

```bash
cp .env.example .env
docker compose up -d        # PostgreSQL асаана
pnpm install
pnpm db:migrate             # хүснэгтүүдийг үүсгэнэ
pnpm dev                    # http://localhost:3000
```

## Deploy

Production нь **Supabase** (PostgreSQL) болон **Vercel** (веб) дээр ажиллана. Заавар: [docs/DEPLOY.md](docs/DEPLOY.md)

## Туршилтын өгөгдөл

`packages/db/seed/demo.sql`: жинхэнэ зурагтай 3 demo дэлгүүр, 18 бараа, 12 үнэлгээ. Supabase SQL Editor эсвэл `psql`-ээр ажиллуулна; `demo-cleanup.sql` бүгдийг устгана (бүх id `demo_` угтвартай).

## Командууд

| Команд | Үйлдэл |
|---|---|
| `pnpm dev` | Хөгжүүлэлтийн сервер |
| `pnpm build` | Бүх апп-ыг build хийх |
| `pnpm typecheck` | TypeScript шалгалт |
| `pnpm db:generate` | Prisma client үүсгэх |
| `pnpm db:migrate` | Схемийн өөрчлөлтийг migration болгох |
| `pnpm db:deploy` | Migration-уудыг Supabase (production) руу хэрэгжүүлэх |
| `pnpm db:studio` | Мэдээллийн санг браузераар харах |
