// Configuração do Next.js. Fora da Vercel a saída é standalone
// (imagem Docker); na Vercel o empacotamento é o padrão.
// Os cabeçalhos de segurança valem em qualquer plataforma.
import type { NextConfig } from "next";

const cabecalhosSeguranca = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
  allowedDevOrigins: ["*.app.github.dev", "127.0.0.1", "localhost"],
  // A versão em Markdown da referência é lida do disco na rota /api/docs/api.md;
  // o arquivo precisa acompanhar a função no standalone e na Vercel.
  outputFileTracingIncludes: {
    "/api/docs/api.md": ["./docs/api.md"],
  },
  async headers() {
    return [
      {
        // Descoberta do índice para agentes de IA na raiz.
        source: "/",
        headers: [{ key: "Link", value: '</llms.txt>; rel="alternate"; type="text/markdown"' }],
      },
      { source: "/:path*", headers: cabecalhosSeguranca },
    ];
  },
};

export default nextConfig;
