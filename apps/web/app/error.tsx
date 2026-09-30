"use client";

import { useEffect } from "react";

// Серверийн алдаа гарахад хоосон хуудасны оронд ойлгомжтой мессеж харуулна
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">Sankhuu</div>
        <h1>Алдаа гарлаа</h1>
        <p className="muted">Түр зуурын саатал байж болно. Дахин оролдоно уу. Асуудал давтагдвал доорх кодыг админд илгээнэ үү.</p>
        {error.digest && (
          <p className="small-text muted">
            Алдааны код: <code>{error.digest}</code>
          </p>
        )}
        <div className="form">
          <button type="button" onClick={reset}>
            Дахин оролдох
          </button>
        </div>
      </div>
    </div>
  );
}
