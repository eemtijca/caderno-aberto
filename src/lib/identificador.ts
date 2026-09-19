// Validação de identificadores UUID antes de chegar ao banco.

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True apenas para strings com formato de UUID. */
export function ehUuid(valor: string | undefined | null): valor is string {
  return typeof valor === "string" && FORMATO_UUID.test(valor);
}
