"use client";

import { useSyncExternalStore } from "react";

// Нэг сагс, олон дэлгүүр: захиалахад дэлгүүр бүрт тусдаа захиалга үүснэ
export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  qty: number;
  maxQty: number;
  shopId: string;
  shopSlug: string;
  shopName: string;
};

const KEY = "sankhuu-cart";
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;
const EMPTY: CartItem[] = [];

function read(): CartItem[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache!;
}
function write(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}

export function useCart() {
  const items = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    read,
    () => EMPTY,
  );
  return {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
    qtyOf: (productId: string) => items.find((i) => i.productId === productId)?.qty ?? 0,
    add(item: Omit<CartItem, "qty">, qty = 1) {
      const cur = read();
      const found = cur.find((i) => i.productId === item.productId);
      write(
        found
          ? cur.map((i) => (i.productId === item.productId ? { ...i, ...item, qty: Math.min(item.maxQty, i.qty + qty) } : i))
          : [...cur, { ...item, qty: Math.min(item.maxQty, qty) }],
      );
    },
    setQty(productId: string, qty: number) {
      write(read().map((i) => (i.productId === productId ? { ...i, qty: Math.min(i.maxQty, qty) } : i)).filter((i) => i.qty > 0));
    },
    remove(productId: string) {
      write(read().filter((i) => i.productId !== productId));
    },
    clear() {
      write([]);
    },
  };
}

// Захиалсан захиалгуудыг "Миний" хуудсанд харуулахаар хадгална (бүртгэлгүй худалдан авагч)
export type SavedOrder = { number: number; phone: string; at: number };
const ORDERS_KEY = "sankhuu-orders";
export function readSavedOrders(): SavedOrder[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function saveOrders(list: SavedOrder[]) {
  const cur = readSavedOrders();
  const merged = [...list.filter((o) => !cur.some((c) => c.number === o.number)), ...cur].slice(0, 50);
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(merged));
  } catch {}
}
