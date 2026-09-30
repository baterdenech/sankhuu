// Хуудас ачаалах хооронд харагдах skeleton
export default function Loading() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Уншиж байна">
      <div className="sk sk-bar" />
      <div className="sk sk-banner" />
      <div className="sk-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="sk sk-img" />
            <div className="sk sk-line" />
            <div className="sk sk-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}
