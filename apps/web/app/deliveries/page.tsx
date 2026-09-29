import { deliveryStatusLabel } from "@/lib/labels";

export default function DeliveriesPage() {
  return (
    <>
      <h1>Хүргэлт</h1>
      <div className="cards" style={{ marginBottom: 16 }}>
        {Object.values(deliveryStatusLabel).map((label) => (
          <div key={label} className="card">
            <div className="label">{label}</div>
            <div className="value">0</div>
          </div>
        ))}
      </div>
      <div className="empty">Диспетчер энд хүргэлтийг жолоочид хуваарилна.</div>
    </>
  );
}
