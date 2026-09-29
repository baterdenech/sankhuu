"use client";

import { useActionState } from "react";
import { sendCode, type FormState } from "./actions";

export function PhoneForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendCode, {});

  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="phone">Утасны дугаар</label>
      <div className="phone-input">
        <span>+976</span>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="9911 2233"
          maxLength={9}
          required
          autoFocus
        />
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Илгээж байна…" : "Код авах"}
      </button>
    </form>
  );
}
