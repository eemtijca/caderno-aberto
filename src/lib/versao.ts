// Versão global da aplicação. Fonte única package.json com override por env.
import pkg from "../../package.json"

export const VERSAO: string = process.env.NEXT_PUBLIC_APP_VERSION ?? pkg.version
export const VERSAO_CURTA = `v${VERSAO}`
