"use client";

import { useEffect, useState } from "react";

// Service worker бүртгэл (зөвхөн production) ба "Апп болгож суулгах" мөр
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

const DISMISS_KEY = "sankhuu-install-dismissed";

export function InstallPrompt({ appName = "Sankhuu" }: { appName?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {}
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (isIos) {
      setIos(true);
      setHidden(false);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };
  return (
    <div className="install-bar" role="region" aria-label="Апп суулгах">
      <span className="install-icon">S</span>
      <span className="install-body">
        <strong>{appName}-г апп болгож суулгах</strong>
        <span>{ios ? "Safari-гийн Хуваалцах товч → «Нүүр дэлгэцэнд нэмэх»" : "Нүүр дэлгэцээс нэг товшилтоор, апп шиг ажиллана"}</span>
      </span>
      {deferred && (
        <button
          type="button"
          className="install-btn"
          onClick={async () => {
            await deferred.prompt();
            const { outcome } = await deferred.userChoice;
            if (outcome === "accepted") setHidden(true);
            setDeferred(null);
          }}
        >
          Суулгах
        </button>
      )}
      <button type="button" className="install-close" onClick={dismiss} aria-label="Хаах">
        ×
      </button>
    </div>
  );
}
