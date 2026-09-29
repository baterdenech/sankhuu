# Sankhuu

Монголд Facebook-ээр бараа зардаг худалдагчдад зориулсан **захиалга + хүргэлтийн** систем.
Хүргэлтийг Sankhuu **өөрийн жолоочоор** гүйцэтгэнэ.

Одоо **1-р шат** хөгжүүлж байна: худалдагч захиалгаа бүртгэхэд хүргэлт автоматаар үүснэ, диспетчер түүнийг жолоочид хуваарилна, жолооч хүргээд бэлэн мөнгийг (COD) цуглуулна, дараа нь Sankhuu худалдагчтай тооцоо хийнэ.
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

## Командууд

| Команд | Үйлдэл |
|---|---|
| `pnpm dev` | Хөгжүүлэлтийн сервер |
| `pnpm build` | Бүх апп-ыг build хийх |
| `pnpm typecheck` | TypeScript шалгалт |
| `pnpm db:generate` | Prisma client үүсгэх |
| `pnpm db:migrate` | Схемийн өөрчлөлтийг migration болгох |
| `pnpm db:studio` | Мэдээллийн санг браузераар харах |
