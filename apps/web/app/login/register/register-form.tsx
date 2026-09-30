"use client";

import { useActionState } from "react";
import { registerWithPassword, type FormState } from "../actions";

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerWithPassword, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="username">Нэвтрэх нэр</label>
      <input id="username" name="username" defaultValue={v.username ?? ""} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="жишээ: sarnai_butik" required autoFocus minLength={3} maxLength={20} />
      <label htmlFor="name">
        Таны нэр <span className="muted">(заавал биш)</span>
      </label>
      <input id="name" name="name" defaultValue={v.name ?? ""} autoComplete="name" maxLength={60} />
      <label htmlFor="phone">
        Утасны дугаар <span className="muted">(заавал биш)</span>
      </label>
      <div className="phone-input">
        <span>+976</span>
        <input id="phone" name="phone" type="tel" inputMode="numeric" defaultValue={v.phone ?? ""} maxLength={9} placeholder="9911 2233" />
      </div>
      <label htmlFor="password">Нууц үг</label>
      <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      <label htmlFor="password2">Нууц үг давтах</label>
      <input id="password2" name="password2" type="password" autoComplete="new-password" required minLength={8} />
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Бүртгэж байна…" : "Бүртгүүлэх"}
      </button>
    </form>
  );
}
