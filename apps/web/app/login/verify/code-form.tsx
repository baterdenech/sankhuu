"use client";

import { useActionState } from "react";
import { verifyCode, type FormState } from "../actions";

export function CodeForm({ phone, next }: { phone: string; next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyCode, {});

  return (
    <form action={action} className="form">
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="next" value={next} />
      <label htmlFor="code">Баталгаажуулах код</label>
      <input
        id="code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={10}
        placeholder="123456"
        className="code-input"
        required
        autoFocus
      />
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Шалгаж байна…" : "Нэвтрэх"}
      </button>
    </form>
  );
}
