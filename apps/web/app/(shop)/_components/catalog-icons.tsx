// Ангилал, түргэн цэс, туслахын SVG дүрсүүд: 24px тор, 1.75 зузаан, дугуй үзүүртэй нэг систем.
// Emoji-гийн оронд: төхөөрөмж бүр дээр ижил, өнгийг CSS-ээр (currentColor) удирдана.
type P = { size?: number; className?: string };
const base = (size = 24) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

const CATEGORY_PATHS: Record<string, React.ReactNode> = {
  // Футболк
  Хувцас: <><path d="M8.6 3.8 12 5.2l3.4-1.4 4.1 2.6-1.6 3-1.9-.7V20H8V8.7l-1.9.7-1.6-3z" /><path d="M9.5 4.2c.4 1.4 1.3 2.1 2.5 2.1s2.1-.7 2.5-2.1" /></>,
  // Пүүз
  Гутал: <><path d="M3 15.2c0-.9.5-1.6 1.3-1.9L8 12l1.8-3 1.7 1.6c1.4 1.4 3.2 2.2 5.2 2.5l2.6.4c1 .1 1.7.9 1.7 1.9V18H3z" /><path d="M3 18h18" /><path d="m11.2 11.4 1.3 1.3M13.1 10.2l1.3 1.3" /></>,
  // Гар цүнх
  "Цүнх, аксессуар": <><path d="M4.5 9.5h15l-1.1 9.7a1.5 1.5 0 0 1-1.5 1.3H7.1a1.5 1.5 0 0 1-1.5-1.3z" /><path d="M8.5 9.5V7.8a3.5 3.5 0 0 1 7 0v1.7" /><path d="M9.5 13v1.2M14.5 13v1.2" /></>,
  // Уруулын будаг
  "Гоо сайхан": <><path d="M10 10V5.2c0-.5.3-.9.7-1.1L13.3 3c.4-.2.7.1.7.5V10" /><path d="M8.5 10h7v3.5h-7z" /><path d="M9.2 13.5h5.6l-.4 7.5H9.6z" /></>,
  // Баавгайн нүүр
  "Хүүхдийн бараа": <><circle cx="12" cy="13" r="6.2" /><circle cx="6.3" cy="7.3" r="2.1" /><circle cx="17.7" cy="7.3" r="2.1" /><path d="M10.2 15c.5.6 1.1.9 1.8.9s1.3-.3 1.8-.9" /><path d="M10 11.6h.01M14 11.6h.01" strokeWidth="2.4" /></>,
  // Диван
  "Гэр ахуй": <><path d="M5 11V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V11" /><path d="M3 12.5a1.5 1.5 0 0 1 3 0V15h12v-2.5a1.5 1.5 0 0 1 3 0V18H3z" /><path d="M5 18v1.8M19 18v1.8" /></>,
  // Ухаалаг утас
  "Электрон бараа": <><rect x="7" y="2.8" width="10" height="18.4" rx="2.2" /><path d="M10.5 6h3" /><path d="M11 18.2h2" /></>,
  // Алим
  Хүнс: <><path d="M12 8.2c-2.6-1.5-6.2.1-6.2 4 0 3.6 2.6 8 5.2 8 .5 0 1-.3 1-.3s.5.3 1 .3c2.6 0 5.2-4.4 5.2-8 0-3.9-3.6-5.5-6.2-4z" /><path d="M12 8.2c0-2 1-3.4 2.6-4.2" /><path d="M10.5 4.5c1.2 0 2 .6 2.4 1.7-1.2.2-2-.4-2.4-1.7z" fill="currentColor" stroke="none" /></>,
  // Гантель
  Спорт: <><path d="M2.5 10.5h2v3h-2zM19.5 10.5h2v3h-2z" /><rect x="5.5" y="8.3" width="3" height="7.4" rx="1" /><rect x="15.5" y="8.3" width="3" height="7.4" rx="1" /><path d="M8.5 12h7" /></>,
  // Бэлэг
  Бусад: <><rect x="3.5" y="9.5" width="17" height="10.5" rx="1.6" /><path d="M3.5 13.5h17M12 9.5V20" /><path d="M12 9.5c-1.4-3.4-4.8-4-4.8-1.6S10.2 9.5 12 9.5zm0 0c1.4-3.4 4.8-4 4.8-1.6S13.8 9.5 12 9.5z" /></>,
};

export function CategoryIcon({ name, size, className }: { name?: string | null } & P) {
  return (
    <svg {...base(size)} className={className}>
      {CATEGORY_PATHS[name ?? "Бусад"] ?? CATEGORY_PATHS["Бусад"]}
    </svg>
  );
}

export const TagIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3.5 12.3V4.8c0-.7.6-1.3 1.3-1.3h7.5l8.5 8.5a1.3 1.3 0 0 1 0 1.8l-6.4 6.4a1.3 1.3 0 0 1-1.8 0z" /><circle cx="8.2" cy="8.2" r="1.4" fill="currentColor" stroke="none" /></svg>
);
export const SparkleIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M11 3.5 12.9 8.6 18 10.5l-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z" /><path d="M18.5 15.5 19.3 17.7 21.5 18.5l-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor" stroke="none" /></svg>
);
export const FlameIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12.5 3c.6 3.2 4.5 4.6 4.5 9.3A5 5 0 0 1 7 12.3c0-1.4.4-2.5 1-3.3.2 1.6 1 2.4 1.8 2.4C10.8 9 9.8 6 12.5 3z" /><path d="M10 14.8a2 2 0 0 0 4 0c0-1.2-1-2-2-3.3-1 1.3-2 2.1-2 3.3z" /></svg>
);
export const StoreFrontIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 9.2 5.4 4h13.2L20 9.2" /><path d="M4 9.2a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5.2 12.2V20h13.6v-7.8" /><path d="M10 20v-4.6h4V20" /></svg>
);
export const ParcelIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m3.5 7.6 8.5-4 8.5 4-8.5 4z" /><path d="M3.5 7.6v8.8l8.5 4 8.5-4V7.6" /><path d="M12 11.6v8.8" /><path d="m7.6 5.7 8.6 4.1" /></svg>
);
export const ChatIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v6.8a2.6 2.6 0 0 1-2.6 2.6H10l-4.6 3.6V16A2.6 2.6 0 0 1 4 13.4z" /><path d="M8.5 9.3h7M8.5 12.3h4" /></svg>
);
export const SendIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 12 20 4l-4 16-4-7z" /><path d="m12 13 8-9" /></svg>
);
export const CloseIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const HeartIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 0 1 6.5 6.5z" /></svg>
);
export const StarIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" /></svg>
);
export const HelpIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.5a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1 .8-1 1.5v.3" /><path d="M12 16.8h.01" strokeWidth="2.4" /></svg>
);
export const ShieldIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" /><path d="m9.3 12 2 2 3.6-3.8" /></svg>
);
// Шүүлтүүр (гурван гулсуур)
export const FilterIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h13M21 17h-1" /><circle cx="16" cy="7" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="19" cy="17" r="2" /></svg>
);
