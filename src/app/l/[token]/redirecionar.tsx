"use client";

// Ponte entre a rota real /l/<token> e a vista hash /#/l/<token>.

import { useEffect } from "react";

export function RedirecionarVista({ token }: { token: string }) {
  useEffect(() => {
    // replace troca a URL sem deixar /l/<token> no histórico.
    window.location.replace(`/#/l/${encodeURIComponent(token)}`);
  }, [token]);

  return null;
}
