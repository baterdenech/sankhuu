"use client";

import { usePathname } from "next/navigation";

// Хуудасны эхний замыг data-route болгож өгнө: PC дээр сагс, "Миний" зэрэг хуудсыг нарийн багана болгоход CSS ашиглана
export function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const route = pathname.split("/")[1] || "home";
  return (
    <div className="app-page" data-route={route}>
      {children}
    </div>
  );
}
