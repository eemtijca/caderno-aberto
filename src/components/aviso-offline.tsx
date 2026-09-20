"use client";

// Aviso global de conexão: aparece quando o navegador fica offline.

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function AvisoOffline() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-14 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-[0.8rem] font-semibold text-amber-950 lg:top-16"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden />
      Sem conexão. Verifique sua internet.
    </div>
  );
}
