import "../(shop)/shop.css";

export const metadata = { title: "Холболтгүй · Sankhuu" };

// Service worker: сүлжээгүй үед кэшгүй хуудасны оронд харуулна
export default function OfflinePage() {
  return (
    <div className="app">
      <div className="app-page">
        <div className="empty tall" style={{ marginTop: 80 }}>
          <span className="empty-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0" />
              <path d="M12 19h.01" strokeWidth="2.6" />
              <path d="m3 3 18 18" />
            </svg>
          </span>
          <p>Интернэт холболт алга.</p>
          <p className="muted small-text">Холболт сэргэхэд хуудас дахин ачаална.</p>
          <a href="/" className="btn primary">
            Дахин оролдох
          </a>
        </div>
      </div>
    </div>
  );
}
