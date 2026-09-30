"use client";

import { useState, useTransition } from "react";
import type { DeliveryStatus } from "@sankhuu/db";
import { assign, returnToShop, unassign, type ActionState } from "./actions";

type DriverOpt = { id: string; label: string; online: boolean; load: number };

// Хүргэлтийн мөрөн дээрх үйлдлүүд: жолооч сонгож оноох / оноолт цуцлах / дэлгүүрт буцаах
export function AssignForm({ deliveryId, status, currentDriverId, drivers }: { deliveryId: string; status: DeliveryStatus; currentDriverId: string | null; drivers: DriverOpt[] }) {
  const [driverId, setDriverId] = useState(currentDriverId ?? "");
  const [state, setState] = useState<ActionState>({});
  const [pending, start] = useTransition();
  const go = (fn: () => Promise<ActionState>) => start(async () => setState(await fn()));

  const canAssign = status === "PENDING" || status === "ASSIGNED" || status === "FAILED";
  return (
    <div className="assign">
      {canAssign && (
        <>
          <select value={driverId} onChange={(e) => setDriverId(e.target.value)} disabled={pending} aria-label="Жолооч">
            <option value="">Жолооч сонгох</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.online ? "● " : "○ "}
                {d.label} ({d.load})
              </option>
            ))}
          </select>
          <button type="button" className="btn primary" disabled={pending || !driverId || driverId === currentDriverId} onClick={() => go(() => assign(deliveryId, driverId))}>
            {status === "PENDING" ? "Оноох" : "Дахин оноох"}
          </button>
        </>
      )}
      {status === "ASSIGNED" && (
        <button type="button" className="btn" disabled={pending} onClick={() => go(() => unassign(deliveryId))}>
          Цуцлах
        </button>
      )}
      {status === "FAILED" && (
        <button type="button" className="btn" disabled={pending} onClick={() => window.confirm("Барааг дэлгүүрт буцааж, захиалгыг буцаагдсан болгох уу? Үлдэгдэл нэмэгдэнэ.") && go(() => returnToShop(deliveryId))}>
          Дэлгүүрт буцаасан
        </button>
      )}
      {state.error && <span className="form-error">{state.error}</span>}
    </div>
  );
}
