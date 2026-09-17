// Versão global da aplicação, fixada no package.json.
import pkg from "../../package.json";

export const VERSAO: string = pkg.version;
export const VERSAO_CURTA = `v${VERSAO}`;
