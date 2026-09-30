"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { UB_CENTER } from "@/lib/geo";

export type MapDriver = { id: string; name: string; phone: string | null; online: boolean; load: number; lat: number; lng: number; seenAt: string | null };
export type MapDelivery = {
  id: string;
  number: number;
  status: "PENDING" | "ASSIGNED" | "PICKED_UP";
  driver: string | null;
  shop: string;
  customer: string;
  pickup: { lat: number; lng: number } | null;
  dropoff: { lat: number; lng: number } | null;
  cod: number;
};

const STATUS_COLOR: Record<MapDelivery["status"], string> = { PENDING: "#b45309", ASSIGNED: "#1d4ed8", PICKED_UP: "#6d28d9" };

// Диспетчерийн газрын зураг: жолоочид (ногоон онлайн / саарал офлайн), хүргэлтийн авах (дэлгүүр) ба хүргэх цэгүүд; 30 сек тутам шинэчлэгдэнэ
export function DispatchMap({ drivers, deliveries }: { drivers: MapDriver[]; deliveries: MapDelivery[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(ref.current).setView(UB_CENTER, 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(mapRef.current);
      }
      const map = mapRef.current;
      const layer = L.layerGroup().addTo(map);
      const bounds: [number, number][] = [];

      for (const d of drivers) {
        const icon = L.divIcon({ className: "map-driver", html: `<span style="background:${d.online ? "#16a34a" : "#9a9a9a"}">${d.name.slice(0, 1)}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] });
        L.marker([d.lat, d.lng], { icon })
          .bindPopup(`<strong>${d.name}</strong><br>${d.online ? "Онлайн" : "Офлайн"} · замд ${d.load}<br>${d.phone ? `<a href="tel:${d.phone}">${d.phone}</a><br>` : ""}<small>${d.seenAt ? new Date(d.seenAt).toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" }) : ""}</small>`)
          .addTo(layer);
        bounds.push([d.lat, d.lng]);
      }
      for (const x of deliveries) {
        const color = STATUS_COLOR[x.status];
        const popup = `<strong>#${x.number}</strong> · ${x.shop} → ${x.customer}<br>${x.driver ? `Жолооч: ${x.driver}` : "Оноогоогүй"} · ${x.cod.toLocaleString("en-US")}₮<br><a href="/admin">Самбар дээр харах</a>`;
        if (x.dropoff) {
          const icon = L.divIcon({ className: "map-pin", html: `<span style="background:${color}"></span>`, iconSize: [26, 34], iconAnchor: [13, 34] });
          L.marker([x.dropoff.lat, x.dropoff.lng], { icon }).bindPopup(popup).addTo(layer);
          bounds.push([x.dropoff.lat, x.dropoff.lng]);
        }
        if (x.pickup) {
          L.circleMarker([x.pickup.lat, x.pickup.lng], { radius: 7, color, fillColor: "#fff", fillOpacity: 1, weight: 3 }).bindPopup(`Авах: ${x.shop} (#${x.number})`).addTo(layer);
          bounds.push([x.pickup.lat, x.pickup.lng]);
        }
        if (x.pickup && x.dropoff) L.polyline([[x.pickup.lat, x.pickup.lng], [x.dropoff.lat, x.dropoff.lng]], { color, weight: 2, dashArray: "4 6", opacity: 0.7 }).addTo(layer);
      }
      if (bounds.length && !map.getBounds().isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      else if (bounds.length && !(map as unknown as { _fitted?: boolean })._fitted) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        (map as unknown as { _fitted?: boolean })._fitted = true;
      }
      return () => layer.remove();
    });
    return () => {
      cancelled = true;
    };
  }, [drivers, deliveries]);

  useEffect(() => () => {
    mapRef.current?.remove();
    mapRef.current = null;
  }, []);

  return <div ref={ref} className="dispatch-map" />;
}
