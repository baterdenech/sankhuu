// Enum-уудын монгол нэр (UI-д харуулах)

export const orderStatusLabel = {
  NEW: "Шинэ",
  CONFIRMED: "Баталгаажсан",
  READY_FOR_PICKUP: "Жолооч хүлээж байна",
  IN_DELIVERY: "Хүргэлтэд гарсан",
  DELIVERED: "Хүргэгдсэн",
  CANCELLED: "Цуцлагдсан",
  RETURNED: "Буцаагдсан",
} as const;

export const deliveryStatusLabel = {
  PENDING: "Жолооч хуваарилаагүй",
  ASSIGNED: "Жолоочид оноосон",
  PICKED_UP: "Барааг авсан",
  DELIVERED: "Хүргэсэн",
  FAILED: "Амжилтгүй",
  RETURNED_TO_SHOP: "Дэлгүүрт буцаасан",
  CANCELLED: "Цуцлагдсан",
} as const;

export const vehicleTypeLabel = {
  CAR: "Машин",
  MOTORBIKE: "Мотоцикл",
  BICYCLE: "Дугуй",
  ON_FOOT: "Явган",
} as const;

export const settlementStatusLabel = {
  PENDING: "Хүлээгдэж буй",
  PAID: "Төлсөн",
} as const;

export function formatMNT(amount: number) {
  return `${amount.toLocaleString("en-US")}₮`;
}

// Үлдэгдэл энэ тооноос бага буюу тэнцүү бол "дуусч байна" гэж анхааруулна
export const LOW_STOCK = 3;
