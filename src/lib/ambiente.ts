// Variáveis de ambiente validadas na partida.
import { z } from "zod";

const esquema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL não definida."),
  // Conexão do CLI Prisma. Opcional em local/CI, cai em DATABASE_URL.
  DIRECT_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET precisa de ao menos 32 caracteres."),
  STORAGE_DRIVER: z.enum(["disk", "s3"]).default("disk"),
  UPLOAD_DIR: z.string().default("/data/imagens"),
  STORAGE_S3_ENDPOINT: z.string().optional(),
  STORAGE_S3_REGION: z.string().optional(),
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_SECRET_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  // Vazia conta como ausente (Compose e shells entregam "" sem valor).
  APP_URL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url("APP_URL precisa ser uma URL válida.").optional(),
  ),
  AUTH_LIMITE_TENTATIVAS: z.coerce.number().int().positive().default(30),
  AUTH_LIMITE_CODIGO: z.coerce.number().int().positive().default(5),
  // Validade do código de acesso, em minutos.
  CODIGO_EXPIRA_MINUTOS: z.coerce.number().int().positive().default(60),
});

const parsed = esquema.safeParse(process.env);

// No build, usa valores fictícios para coleta de tipos.
if (!parsed.success && process.env.NEXT_PHASE !== "phase-production-build") {
  const detalhe = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(`Variáveis de ambiente inválidas: ${detalhe}`);
}

const env = parsed.success
  ? parsed.data
  : {
      DATABASE_URL: "postgresql://build:build@localhost:5432/build",
      DIRECT_URL: undefined,
      AUTH_SECRET: "segredo-ficticio-de-build-com-32-bytes-ok",
      STORAGE_DRIVER: "disk" as const,
      UPLOAD_DIR: "/tmp/build-imagens",
      STORAGE_S3_ENDPOINT: undefined,
      STORAGE_S3_REGION: undefined,
      STORAGE_S3_BUCKET: undefined,
      STORAGE_S3_ACCESS_KEY: undefined,
      STORAGE_S3_SECRET_KEY: undefined,
      CRON_SECRET: undefined,
      APP_URL: undefined,
      AUTH_LIMITE_TENTATIVAS: 30,
      AUTH_LIMITE_CODIGO: 5,
      CODIGO_EXPIRA_MINUTOS: 60,
    };

if (env.STORAGE_DRIVER === "s3") {
  const faltando = [
    "STORAGE_S3_ENDPOINT",
    "STORAGE_S3_REGION",
    "STORAGE_S3_BUCKET",
    "STORAGE_S3_ACCESS_KEY",
    "STORAGE_S3_SECRET_KEY",
  ].filter((chave) => !env[chave as keyof typeof env]);
  if (faltando.length > 0) {
    throw new Error(`STORAGE_DRIVER=s3 exige ${faltando.join(", ")}.`);
  }
}

// Em produção, a purga exige configuração explícita.
const emProducao =
  process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";
if (emProducao && !env.CRON_SECRET) {
  throw new Error("CRON_SECRET é obrigatório em produção.");
}

export const DATABASE_URL = env.DATABASE_URL;
export const DIRECT_URL = env.DIRECT_URL ?? env.DATABASE_URL;
export const AUTH_SECRET = env.AUTH_SECRET;
export const STORAGE_DRIVER = env.STORAGE_DRIVER;
export const UPLOAD_DIR = env.UPLOAD_DIR;
export const STORAGE_S3_ENDPOINT = env.STORAGE_S3_ENDPOINT ?? "";
export const STORAGE_S3_REGION = env.STORAGE_S3_REGION ?? "";
export const STORAGE_S3_BUCKET = env.STORAGE_S3_BUCKET ?? "";
export const STORAGE_S3_ACCESS_KEY = env.STORAGE_S3_ACCESS_KEY ?? "";
export const STORAGE_S3_SECRET_KEY = env.STORAGE_S3_SECRET_KEY ?? "";
export const CRON_SECRET = env.CRON_SECRET ?? "";
export const APP_URL = env.APP_URL ?? "";
export const LIMITE_TENTATIVAS_LOGIN = env.AUTH_LIMITE_TENTATIVAS;
export const LIMITE_CODIGO = env.AUTH_LIMITE_CODIGO;
export const CODIGO_EXPIRA_MINUTOS = env.CODIGO_EXPIRA_MINUTOS;
