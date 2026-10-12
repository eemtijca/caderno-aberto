# Caderno Aberto. Imagem da aplicação (Next.js standalone).
# Multi-estágio para manter a imagem final pequena.

# Base comum: habilita o pnpm via Corepack em todos os estágios.
FROM node:24-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# 1. Dependências (scripts/ junto: o postinstall copia o TikZJax;
# prisma/ junto: o postinstall gera o cliente Prisma)
FROM base AS dependencias
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts ./scripts
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

# 2. Compilação
FROM base AS compilacao
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY --from=dependencias /app/generated ./generated
COPY . .
# Os assets do postinstall (TikZJax e Swagger UI) não existem no contexto do Git.
COPY --from=dependencias /app/public ./public
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# 3. Dependências de produção (o migrador e os scripts administrativos rodam
# fora da árvore do standalone e usam pg e dotenv).
FROM base AS producao
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# 4. Execução (somente o necessário)
FROM node:24-bookworm-slim AS execucao
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# sharp precisa destas bibliotecas no Debian slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data/imagens && chown node:node /data/imagens
# Dependências de produção completas (o standalone não cobre o migrador).
COPY --from=producao /app/node_modules ./node_modules
# Servidor standalone do Next e arquivos estáticos.
COPY --from=compilacao /app/.next/standalone/server.js ./server.js
COPY --from=compilacao /app/.next/standalone/package.json ./package.json
COPY --from=compilacao /app/.next/standalone/.next ./.next
# Documentação em Markdown lida em tempo de execução por /api/docs/api.md.
COPY --from=compilacao /app/.next/standalone/docs ./docs
COPY --from=compilacao /app/.next/static ./.next/static
COPY --from=compilacao /app/public ./public
COPY --from=compilacao /app/docker ./docker
COPY --from=compilacao /app/scripts ./scripts
COPY --from=compilacao /app/generated ./generated
COPY --from=compilacao /app/prisma ./prisma
RUN chmod +x ./docker/app/entrypoint.sh
USER node
EXPOSE 3000
CMD ["./docker/app/entrypoint.sh"]
