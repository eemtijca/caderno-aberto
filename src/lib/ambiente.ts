// Variáveis de ambiente validadas na partida.
import { z } from "zod"

const esquema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL não definida."),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET precisa de ao menos 32 caracteres."),
  EMAIL_DRIVER: z.enum(["log", "smtp", "resend"]).default("log"),
  EMAIL_FROM: z.string().default("Caderno Aberto <contato@exemplo.br>"),
  RESEND_API_KEY: z.string().optional(),
  SMTP_URL: z.string().optional(),
  STORAGE_DRIVER: z.enum(["disk", "s3"]).default("disk"),
  UPLOAD_DIR: z.string().default("/data/imagens"),
  STORAGE_S3_ENDPOINT: z.string().optional(),
  STORAGE_S3_REGION: z.string().optional(),
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_SECRET_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  APP_URL: z.string().url("APP_URL precisa ser uma URL válida.").optional(),
  ALLOW_TEST_OUTBOX: z.enum(["0", "1"]).default("0"),
  TESTES_CI: z.enum(["0", "1"]).default("0"),
  AUTH_LIMITE_TENTATIVAS: z.coerce.number().int().positive().default(30),
  AUTH_LIMITE_EMAIL: z.coerce.number().int().positive().default(10),
})

const parsed = esquema.safeParse(process.env)

// No build, usa valores fictícios para coleta de tipos.
if (!parsed.success && process.env.NEXT_PHASE !== "phase-production-build") {
  const detalhe = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
  throw new Error(`Variáveis de ambiente inválidas: ${detalhe}`)
}

const env = parsed.success
  ? parsed.data
  : {
      DATABASE_URL: "postgresql://build:build@localhost:5432/build",
      AUTH_SECRET: "segredo-ficticio-de-build-com-32-bytes-ok",
      EMAIL_DRIVER: "log" as const,
      EMAIL_FROM: "Build <build@exemplo.br>",
      RESEND_API_KEY: undefined,
      SMTP_URL: undefined,
      STORAGE_DRIVER: "disk" as const,
      UPLOAD_DIR: "/tmp/build-imagens",
      STORAGE_S3_ENDPOINT: undefined,
      STORAGE_S3_REGION: undefined,
      STORAGE_S3_BUCKET: undefined,
      STORAGE_S3_ACCESS_KEY: undefined,
      STORAGE_S3_SECRET_KEY: undefined,
      CRON_SECRET: undefined,
      APP_URL: undefined,
      ALLOW_TEST_OUTBOX: "0" as const,
      TESTES_CI: "0" as const,
      AUTH_LIMITE_TENTATIVAS: 30,
      AUTH_LIMITE_EMAIL: 10,
    }

if (env.EMAIL_DRIVER === "resend" && !env.RESEND_API_KEY) {
  throw new Error("EMAIL_DRIVER=resend exige RESEND_API_KEY.")
}

if (env.EMAIL_DRIVER === "smtp" && !env.SMTP_URL) {
  throw new Error("EMAIL_DRIVER=smtp exige SMTP_URL.")
}

if (env.STORAGE_DRIVER === "s3") {
  const faltando = [
    "STORAGE_S3_ENDPOINT",
    "STORAGE_S3_REGION",
    "STORAGE_S3_BUCKET",
    "STORAGE_S3_ACCESS_KEY",
    "STORAGE_S3_SECRET_KEY",
  ].filter((chave) => !env[chave as keyof typeof env])
  if (faltando.length > 0) {
    throw new Error(`STORAGE_DRIVER=s3 exige ${faltando.join(", ")}.`)
  }
}

// Em produção, a purga e a caixa de teste exigem configuração explícita.
const emProducao =
  process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build"
if (emProducao && !env.CRON_SECRET) {
  throw new Error("CRON_SECRET é obrigatório em produção.")
}
if (emProducao && env.ALLOW_TEST_OUTBOX === "1" && env.TESTES_CI !== "1") {
  throw new Error("ALLOW_TEST_OUTBOX=1 é proibido em produção (só com TESTES_CI=1).")
}

export const DATABASE_URL = env.DATABASE_URL
export const AUTH_SECRET = env.AUTH_SECRET
export const EMAIL_DRIVER = env.EMAIL_DRIVER
export const EMAIL_FROM = env.EMAIL_FROM
export const RESEND_API_KEY = env.RESEND_API_KEY ?? ""
export const SMTP_URL = env.SMTP_URL ?? ""
export const STORAGE_DRIVER = env.STORAGE_DRIVER
export const UPLOAD_DIR = env.UPLOAD_DIR
export const STORAGE_S3_ENDPOINT = env.STORAGE_S3_ENDPOINT ?? ""
export const STORAGE_S3_REGION = env.STORAGE_S3_REGION ?? ""
export const STORAGE_S3_BUCKET = env.STORAGE_S3_BUCKET ?? ""
export const STORAGE_S3_ACCESS_KEY = env.STORAGE_S3_ACCESS_KEY ?? ""
export const STORAGE_S3_SECRET_KEY = env.STORAGE_S3_SECRET_KEY ?? ""
export const CRON_SECRET = env.CRON_SECRET ?? ""
export const APP_URL = env.APP_URL ?? ""
export const PERMITE_OUTBOX_TESTE = env.ALLOW_TEST_OUTBOX === "1"
export const LIMITE_TENTATIVAS_LOGIN = env.AUTH_LIMITE_TENTATIVAS
export const LIMITE_ENVIOS_EMAIL = env.AUTH_LIMITE_EMAIL
