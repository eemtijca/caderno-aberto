// Fábrica do armazenamento a partir de STORAGE_DRIVER.
import { STORAGE_DRIVER } from "@/lib/ambiente";
import { provedorAzureBlob } from "./provedor-azure-blob";
import { provedorDisco } from "./provedor-disco";
import { provedorS3 } from "./provedor-s3";
import type { ProvedorArmazenamento } from "./tipos";

// Cache do provedor: a escolha por env não muda em execução.
let provedor: ProvedorArmazenamento | null = null;

export function obterArmazenamento(): ProvedorArmazenamento {
  if (!provedor) {
    if (STORAGE_DRIVER === "s3") provedor = provedorS3();
    else if (STORAGE_DRIVER === "azure-blob") provedor = provedorAzureBlob();
    else provedor = provedorDisco();
  }
  return provedor;
}

/** O caminho pertence ao professor e não foge da pasta dele. */
export function caminhoDoProfessor(caminho: string, professorId: string): boolean {
  // Bloqueia travessia com ".." e exige o prefixo do dono.
  return caminho.startsWith(`${professorId}/`) && !caminho.includes("..") && caminho.includes("/");
}
