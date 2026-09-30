"use client";

import { useTransition } from "react";
import { setOnline } from "./actions";
import { getGeo } from "./geo";

export function OnlineToggle({ online }: { online: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={`online-toggle${online ? " on" : ""}`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setOnline(!online, await getGeo());
        })
      }
      aria-pressed={online}
    >
      <span className="dot" />
      {online ? "Онлайн" : "Офлайн"}
    </button>
  );
}
