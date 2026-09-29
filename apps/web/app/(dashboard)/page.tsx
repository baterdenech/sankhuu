import { formatMNT } from "@/lib/labels";

// TODO: Prisma-аас бодит тоо татах
const stats = [
  { label: "Өнөөдрийн захиалга", value: "0" },
  { label: "Хүргэлтэд гарсан", value: "0" },
  { label: "Өнөөдрийн борлуулалт", value: formatMNT(0) },
  { label: "Шилжүүлэх дүн (COD)", value: formatMNT(0) },
];

export default function DashboardPage() {
  return (
    <>
      <h1>Хянах самбар</h1>
      <div className="cards">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="label">{s.label}</div>
            <div className="value">{s.value}</div>
          </div>
        ))}
      </div>
    </>
  );
}
