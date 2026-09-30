"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { UB_CENTER } from "@/lib/geo";

type LatLng = { lat: number; lng: number };

// Газрын зураг дээр цэг заах (OpenStreetMap, түлхүүр шаардахгүй). Утгыг hidden input `lat`, `lng`-ээр формд өгнө.
export function LocationPicker({ initial, names = { lat: "lat", lng: "lng" }, compact = false }: { initial?: LatLng | null; names?: { lat: string; lng: string }; compact?: boolean }) {
  const [open, setOpen] = useState(Boolean(initial));
  const [pos, setPos] = useState<LatLng | null>(initial ?? null);
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!open || !ref.current || mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !ref.current || mapRef.current) return;
      const start: [number, number] = pos ? [pos.lat, pos.lng] : UB_CENTER;
      const map = L.map(ref.current, { zoomControl: true, attributionControl: true }).setView(start, pos ? 16 : 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
      const icon = L.divIcon({ className: "map-pin", html: "<span></span>", iconSize: [26, 34], iconAnchor: [13, 34] });
      const marker = L.marker(start, { draggable: true, icon }).addTo(map);
      const commit = (ll: { lat: number; lng: number }) => setPos({ lat: ll.lat, lng: ll.lng });
      marker.on("dragend", () => commit(marker.getLatLng()));
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        commit(e.latlng);
      });
      if (!pos) commit(marker.getLatLng());
      mapRef.current = map;
      markerRef.current = marker;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function locateMe() {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const ll = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(ll);
        mapRef.current?.setView([ll.lat, ll.lng], 17);
        markerRef.current?.setLatLng([ll.lat, ll.lng]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  return (
    <div className={`locpick${compact ? " compact" : ""}`}>
      {pos && open && (
        <>
          <input type="hidden" name={names.lat} value={pos.lat} />
          <input type="hidden" name={names.lng} value={pos.lng} />
        </>
      )}
      {!open ? (
        <button type="button" className="locpick-open" onClick={() => setOpen(true)}>
          Газрын зураг дээр байршил заах <span className="muted">(заавал биш, жолоочид амар)</span>
        </button>
      ) : (
        <>
          <div className="locpick-bar">
            <span className="muted small-text">Цэгийг чирж эсвэл газрын зураг дээр дарж байршлаа заана уу.</span>
            <button type="button" className="locpick-btn" onClick={locateMe}>
              Миний байршил
            </button>
            <button type="button" className="locpick-btn" onClick={() => (setOpen(false), setPos(null))}>
              Хасах
            </button>
          </div>
          <div ref={ref} className="locpick-map" />
        </>
      )}
    </div>
  );
}
