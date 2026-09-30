import { PRODUCT_CATEGORIES } from "@/lib/categories";

export const CATEGORY_ICONS: Record<string, string> = {
  Хувцас: "👗",
  Гутал: "👟",
  "Цүнх, аксессуар": "👜",
  "Гоо сайхан": "💄",
  "Хүүхдийн бараа": "🧸",
  "Гэр ахуй": "🏠",
  "Электрон бараа": "📱",
  Хүнс: "🍎",
  Спорт: "🏀",
  Бусад: "🎁",
};
export const ALL_CATEGORIES = PRODUCT_CATEGORIES;

// Ангилал бүрийн пастель өнгө (дүрсний дэвсгэр, зураггүй барааны placeholder)
export const CATEGORY_COLORS: Record<string, string> = {
  Хувцас: "#ffe4e6",
  Гутал: "#e0f2fe",
  "Цүнх, аксессуар": "#fef3c7",
  "Гоо сайхан": "#fce7f3",
  "Хүүхдийн бараа": "#dcfce7",
  "Гэр ахуй": "#ede9fe",
  "Электрон бараа": "#e0e7ff",
  Хүнс: "#ffedd5",
  Спорт: "#ccfbf1",
  Бусад: "#f1f5f9",
};
export function categoryStyle(category: string | null | undefined) {
  return { background: CATEGORY_COLORS[category ?? "Бусад"] ?? CATEGORY_COLORS["Бусад"], icon: CATEGORY_ICONS[category ?? "Бусад"] ?? "🎁" };
}

// Хүргэлтийн амлалт (картан дээр ногооноор харагдана). Бизнесийн нөхцөл өөрчлөгдвөл эндээс засна.
export const DELIVERY_PROMISE = "1-2 өдөрт хүргэнэ";
export const DELIVERY_FROM = "Хүргэлт 5,000₮-с";

// Coupang маягийн "Маргааш (Лх) хүргэнэ" шошго: энэ цагаас өмнө захиалбал маргааш, дараа бол нөгөөдөр.
export const ORDER_CUTOFF_HOUR = 15;
const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
export function arrivalLabel(now = new Date()) {
  // Улаанбаатарын цагаар (UTC+8, зуны цаг байхгүй)
  const ub = new Date(now.getTime() + 8 * 3600 * 1000);
  const days = ub.getUTCHours() < ORDER_CUTOFF_HOUR ? 1 : 2;
  const day = new Date(ub.getTime() + days * 86400 * 1000);
  return `${days === 1 ? "Маргааш" : "Нөгөөдөр"} (${WEEKDAYS[day.getUTCDay()]}) хүргэнэ`;
}
