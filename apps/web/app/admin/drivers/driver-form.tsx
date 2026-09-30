"use client";

import { useActionState } from "react";
import { vehicleTypeLabel } from "@/lib/labels";
import { addDriver, type ActionState } from "../actions";

export function DriverForm({ canCreate }: { canCreate: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addDriver, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="form" key={state.ok}>
      <div className="row">
        <div>
          <label htmlFor="username">Нэвтрэх нэр</label>
          <input id="username" name="username" defaultValue={v.username ?? ""} required autoComplete="off" placeholder="bat_driver" />
        </div>
        <div>
          <label htmlFor="name">Нэр</label>
          <input id="name" name="name" defaultValue={v.name ?? ""} placeholder="Бат" />
        </div>
      </div>
      <div className="row">
        <div>
          <label htmlFor="phone">Утас</label>
          <input id="phone" name="phone" type="tel" inputMode="numeric" defaultValue={v.phone ?? ""} placeholder="9911 2233" />
        </div>
        <div>
          <label htmlFor="password">Нууц үг {canCreate ? "(шинэ бүртгэлд)" : "(бүртгэл үүсгэх боломжгүй)"}</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} disabled={!canCreate} placeholder="8+ тэмдэгт" />
        </div>
      </div>
      <div className="row">
        <div>
          <label htmlFor="vehicle">Тээвэр</label>
          <select id="vehicle" name="vehicle" defaultValue={v.vehicle ?? "CAR"}>
            {Object.entries(vehicleTypeLabel).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="plate">Улсын дугаар</label>
          <input id="plate" name="plate" defaultValue={v.plate ?? ""} placeholder="1234 УБА" />
        </div>
      </div>
      <p className="muted small-text" style={{ margin: 0 }}>
        Нэвтрэх нэр нь бүртгэлтэй хэрэглэгчийнх бол түүнийг жолооч болгоно; бүртгэлгүй бол нууц үгтэй нь хамт шинэ бүртгэл үүсгэнэ.
      </p>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="ai-status ok">{state.ok}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Хадгалж байна…" : "Жолооч нэмэх"}
      </button>
    </form>
  );
}
