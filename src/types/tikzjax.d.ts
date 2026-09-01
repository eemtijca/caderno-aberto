// Tipos do TikzJax: opções globais (injetadas no layout) e o evento
// "tikzjax-load-finished" disparado quando a renderização termina.

export {}

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    "ontikzjax-load-finished"?: ReactEventHandler<T> | undefined
  }
}

declare global {
  interface Window {
    TikzJaxOptions?: Record<string, unknown>
  }
}
