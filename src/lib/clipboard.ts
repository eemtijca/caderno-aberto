"use client";

// Cópia para a área de transferência com fallback para navegadores antigos.

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copiado = document.execCommand("copy");
    area.remove();
    return copiado;
  } catch {
    return false;
  }
}
