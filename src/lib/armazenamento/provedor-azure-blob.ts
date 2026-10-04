// Armazenamento no Azure Blob Storage. A chave é o caminho relativo.
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import {
  AZURE_STORAGE_ACCOUNT_URL,
  AZURE_STORAGE_CONNECTION_STRING,
  AZURE_STORAGE_CONTAINER,
} from "@/lib/ambiente";
import { mimePorExtensao } from "./provedor-disco";
import type { ProvedorArmazenamento } from "./tipos";

let container: ContainerClient | null = null;

function obterContainer(): ContainerClient {
  if (!container) {
    // A chave compartilhada atende ao emulador e aos testes; fora dela vale a
    // identidade gerenciada do serviço.
    const servico = AZURE_STORAGE_CONNECTION_STRING
      ? BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
      : new BlobServiceClient(AZURE_STORAGE_ACCOUNT_URL, new DefaultAzureCredential());
    container = servico.getContainerClient(AZURE_STORAGE_CONTAINER);
  }
  return container;
}

export function provedorAzureBlob(): ProvedorArmazenamento {
  const blob = (caminho: string) => obterContainer().getBlockBlobClient(caminho);

  return {
    nome: "azure-blob",
    async salvar(caminho, bytes, mime) {
      await blob(caminho).uploadData(bytes, {
        blobHTTPHeaders: { blobContentType: mime },
      });
    },
    async ler(caminho) {
      try {
        const bytes = await blob(caminho).downloadToBuffer();
        return { bytes, mime: mimePorExtensao(caminho) };
      } catch {
        return null;
      }
    },
    async remover(caminho) {
      await blob(caminho)
        .deleteIfExists()
        .catch(() => undefined);
    },
    async listar(prefixo) {
      const saida: { caminho: string; mime: string }[] = [];
      try {
        const prefixoComBarra = prefixo.endsWith("/") ? prefixo : `${prefixo}/`;
        for await (const item of obterContainer().listBlobsFlat({ prefix: prefixoComBarra })) {
          if (item.name) saida.push({ caminho: item.name, mime: mimePorExtensao(item.name) });
        }
      } catch {
        return [];
      }
      return saida;
    },
  };
}
