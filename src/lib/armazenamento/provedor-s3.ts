// Armazenamento via API S3-compatível. A chave é o caminho relativo.
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  STORAGE_S3_ACCESS_KEY,
  STORAGE_S3_BUCKET,
  STORAGE_S3_ENDPOINT,
  STORAGE_S3_REGION,
  STORAGE_S3_SECRET_KEY,
} from "@/lib/ambiente";
import { mimePorExtensao } from "./provedor-disco";
import type { ArquivoGuardado, ProvedorArmazenamento } from "./tipos";

let cliente: S3Client | null = null;

function obterCliente(): S3Client {
  if (!cliente) {
    cliente = new S3Client({
      // Path-style amplia a compatibilidade com serviços S3 alternativos.
      forcePathStyle: true,
      region: STORAGE_S3_REGION,
      endpoint: STORAGE_S3_ENDPOINT,
      credentials: {
        accessKeyId: STORAGE_S3_ACCESS_KEY,
        secretAccessKey: STORAGE_S3_SECRET_KEY,
      },
    });
  }
  return cliente;
}

async function lerCorpo(corpo: unknown): Promise<Buffer> {
  // O SDK pode devolver Uint8Array ou stream assíncrono.
  if (corpo instanceof Uint8Array) return Buffer.from(corpo);
  const partes: Uint8Array[] = [];
  for await (const parte of corpo as AsyncIterable<Uint8Array>) partes.push(parte);
  return Buffer.concat(partes);
}

export function provedorS3(): ProvedorArmazenamento {
  return {
    nome: "s3",
    async salvar(caminho, bytes, mime) {
      await obterCliente().send(
        new PutObjectCommand({
          Bucket: STORAGE_S3_BUCKET,
          Key: caminho,
          Body: bytes,
          ContentType: mime,
        }),
      );
    },
    async ler(caminho): Promise<ArquivoGuardado | null> {
      try {
        const resposta = await obterCliente().send(
          new GetObjectCommand({ Bucket: STORAGE_S3_BUCKET, Key: caminho }),
        );
        const bytes = await lerCorpo(resposta.Body);
        const mime =
          typeof resposta.ContentType === "string" && resposta.ContentType
            ? resposta.ContentType
            : mimePorExtensao(caminho);
        return { bytes, mime };
      } catch {
        return null;
      }
    },
    async remover(caminho) {
      await obterCliente()
        .send(new DeleteObjectCommand({ Bucket: STORAGE_S3_BUCKET, Key: caminho }))
        .catch(() => undefined);
    },
    async listar(prefixo) {
      const saida: { caminho: string; mime: string }[] = [];
      let continuacao: string | undefined;
      try {
        do {
          const pagina = await obterCliente().send(
            new ListObjectsV2Command({
              Bucket: STORAGE_S3_BUCKET,
              Prefix: prefixo.endsWith("/") ? prefixo : `${prefixo}/`,
              ContinuationToken: continuacao,
            }),
          );
          for (const objeto of pagina.Contents ?? []) {
            if (objeto.Key) saida.push({ caminho: objeto.Key, mime: mimePorExtensao(objeto.Key) });
          }
          continuacao = pagina.IsTruncated ? pagina.NextContinuationToken : undefined;
        } while (continuacao);
      } catch {
        return [];
      }
      return saida;
    },
  };
}
