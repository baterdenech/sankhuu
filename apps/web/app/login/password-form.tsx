"use client";

import { useActionState } from "react";
import { signInWithPassword, type FormState } from "./actions";

export function PasswordForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInWithPassword, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="username">Нэвтрэх нэр</label>
      <input id="username" name="username" defaultValue={v.username ?? ""} autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus />
      <label htmlFor="password">Нууц үг</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Шалгаж байна…" : "Нэвтрэх"}
      </button>
    </form>
  );
}
