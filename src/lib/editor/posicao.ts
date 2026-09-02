// Utilitários de posicionamento de UI flutuante do editor: encaixe na
// viewport (nunca deixa elemento fora da tela), altura do teclado virtual
// via visualViewport e detecção de ponteiro fino/grosso.

import { useEffect, useState } from "react"

// encaixa um valor entre mínimo e máximo
export function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), Math.max(minimo, maximo))
}

// largura da viewport visual (considera teclado aberto no mobile)
export function larguraVisual(): number {
  const vv = typeof window === "undefined" ? null : window.visualViewport
  return vv ? vv.width : window.innerWidth
}

// altura da viewport visual (diminui com o teclado aberto no mobile)
export function alturaVisual(): number {
  const vv = typeof window === "undefined" ? null : window.visualViewport
  return vv ? vv.height : window.innerHeight
}

// posição horizontal encaixada para elemento centralizado no ponto dado
export function limitarCentroHorizontal(centro: number, largura: number): number {
  const metade = largura / 2
  return limitar(centro, metade + 8, larguraVisual() - metade - 8)
}

// hook: altura do teclado virtual (0 quando fechado), via visualViewport
export function useAlturaTeclado(): number {
  const [altura, setAltura] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const atualizar = (): void => {
      const aberto = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setAltura(aberto)
    }
    atualizar()
    vv.addEventListener("resize", atualizar)
    vv.addEventListener("scroll", atualizar)
    return () => {
      vv.removeEventListener("resize", atualizar)
      vv.removeEventListener("scroll", atualizar)
    }
  }, [])

  return altura
}

// hook: consulta de media query reativa (ex.: "(pointer: fine)")
export function useMediaQuery(consulta: string): boolean {
  const [combina, setCombina] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const atualizar = (): void => setCombina(mq.matches)
    atualizar()
    mq.addEventListener("change", atualizar)
    return () => {
      mq.removeEventListener("change", atualizar)
    }
  }, [consulta])

  return combina
}
