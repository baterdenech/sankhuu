// Ангилал ба түргэн цэсний SVG дүрсүүд (emoji-гийн оронд: төхөөрөмж бүр дээр ижил, орчин үеийн харагдана)
type P = { size?: number; className?: string };
const base = (size = 24) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

const CATEGORY_PATHS: Record<string, React.ReactNode> = {
  Хувцас: <><path d="M8.5 4 12 5.5 15.5 4l4 2.5-1.6 3.6L16 9.4V20H8V9.4l-1.9.7L4.5 6.5z" /></>,
  Гутал: <><path d="M3 16.5V11l3.5-.5L9 8.5l1.5 1.5c1.8 1.7 4.2 2.4 6.7 2.9L21 13.5v3z" /><path d="M3 16.5h18" /><path d="M9 8.5 8 6" /></>,
  "Цүнх, аксессуар": <><path d="M5 9h14l-1 11H6z" /><path d="M9 9V7a3 3 0 0 1 6 0v2" /><path d="M9 13v1M15 13v1" /></>,
  "Гоо сайхан": <><path d="M9 3h6v6H9z" /><path d="M8 9h8l-1 12H9z" /><path d="M11 13h2" /></>,
  "Хүүхдийн бараа": <><circle cx="12" cy="13" r="6" /><circle cx="6.5" cy="7.5" r="2" /><circle cx="17.5" cy="7.5" r="2" /><path d="M10 14.5c.6.7 1.3 1 2 1s1.4-.3 2-1" /><path d="M10 11.5h.01M14 11.5h.01" /></>,
  "Гэр ахуй": <><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></>,
  "Электрон бараа": <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 17.5h2" /></>,
  Хүнс: <><path d="M12 8c-2.5-1.5-6 0-6 4 0 3.5 2.5 8 5 8 .5 0 1-.3 1-.3s.5.3 1 .3c2.5 0 5-4.5 5-8 0-4-3.5-5.5-6-4z" /><path d="M12 8c0-2 1-3.5 2.5-4" /></>,
  Спорт: <><path d="M3 10h2v4H3zM19 10h2v4h-2zM6 8h2.5v8H6zM15.5 8H18v8h-2.5z" /><path d="M8.5 12h7" /></>,
  Бусад: <><rect x="3.5" y="9" width="17" height="11" rx="1.5" /><path d="M3.5 13h17M12 9v11" /><path d="M12 9c-1.5-3.5-5-4-5-1.5S10 9 12 9zm0 0c1.5-3.5 5-4 5-1.5S14 9 12 9z" /></>,
};

export function CategoryIcon({ name, size, className }: { name?: string | null } & P) {
  return (
    <svg {...base(size)} className={className}>
      {CATEGORY_PATHS[name ?? "Бусад"] ?? CATEGORY_PATHS["Бусад"]}
    </svg>
  );
}

export const TagIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3.5 12.5V4.5h8l9 9-8 8z" /><circle cx="8" cy="9" r="1.3" fill="currentColor" stroke="none" /></svg>
);
export const SparkleIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 3.5 14 9l5.5 2L14 13l-2 5.5L10 13l-5.5-2L10 9z" /><path d="M19 17.5 19.7 19.3 21.5 20l-1.8.7L19 22.5l-.7-1.8-1.8-.7 1.8-.7z" fill="currentColor" stroke="none" /></svg>
);
export const FlameIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3 0 1.5.8 2.2 1.5 2.2C11.5 8.5 10 6.5 12 3z" /><path d="M8 12c-1.5 1.5-2 3-2 4.5A6 6 0 0 0 18 16.5c0-1-.3-2-1-3" /></svg>
);
export const StoreFrontIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 9 5.5 4h13L20 9" /><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9" /><path d="M5 12v8h14v-8" /><path d="M10 20v-5h4v5" /></svg>
);
export const ParcelIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m3.5 7.5 8.5-4 8.5 4-8.5 4z" /><path d="M3.5 7.5v9l8.5 4 8.5-4v-9" /><path d="M12 11.5v9" /><path d="m7.5 5.5 8.5 4" /></svg>
);
export const ChatIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V16A2.5 2.5 0 0 1 4 13.5z" /><path d="M8.5 9.5h7M8.5 12.5h4" /></svg>
);
export const SendIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 12 20 4l-4 16-4-7z" /><path d="m12 13 8-9" /></svg>
);
export const CloseIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
