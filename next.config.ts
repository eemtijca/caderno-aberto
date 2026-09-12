// Configuração do Next.js. Fora da Vercel a saída é standalone
// (imagem Docker); na Vercel o empacotamento é o padrão.
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
  allowedDevOrigins: ["*.app.github.dev", "127.0.0.1", "localhost"],
}

export default nextConfig
