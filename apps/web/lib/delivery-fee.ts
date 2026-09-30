// Хүргэлтийн үнэ (түр тогтмол; дараа нь зай/бүсээр тооцно)
const FEES: Record<string, number> = {
  Баянгол: 5000,
  Баянзүрх: 5000,
  Сүхбаатар: 5000,
  Чингэлтэй: 5000,
  "Хан-Уул": 5000,
  Сонгинохайрхан: 6000,
  Налайх: 12000,
  Багануур: 15000,
  Багахангай: 15000,
};

// null бол тухайн бүсэд хүргэлт хийхгүй
export function deliveryFeeFor(district: string): number | null {
  return FEES[district] ?? null;
}
