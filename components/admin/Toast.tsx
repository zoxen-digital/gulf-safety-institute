"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";

type T = { id: number; ok: boolean; text: string };
const EVT = "gistra-toast";

export function toast(ok: boolean, text: string) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: { ok, text } }));
}

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ ok: boolean; text: string }>).detail;
      const id = Date.now() + Math.random();
      setItems((x) => [...x, { id, ...d }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 5000);
    };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} role={t.ok ? "status" : "alert"} className={`flex items-start gap-3 rounded-md border bg-white p-3.5 text-sm shadow-lg ${t.ok ? "border-success/30" : "border-danger/30"}`}>
          {t.ok ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden /> : <TriangleAlert className="h-5 w-5 shrink-0 text-danger" aria-hidden />}
          <p className="flex-1 text-ink">{t.text}</p>
          <button type="button" aria-label="Dismiss" onClick={() => setItems((x) => x.filter((i) => i.id !== t.id))} className="text-muted hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
