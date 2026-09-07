# Caderno Aberto. Imagem da aplicação (Next.js standalone).
# Multi-estágio para manter a imagem final pequena.

# 1. Dependências (scripts/ junto: o postinstall copia o TikZJax)
FROM node:24-bookworm-slim AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci

# 2. Compilação
FROM node:24-bookworm-slim AS compilacao
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Execução (somente o necessário)
FROM node:24-bookworm-slim AS execucao
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# sharp precisa destas bibliotecas no Debian slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=compilacao /app/.next/standalone ./
COPY --from=compilacao /app/.next/static ./.next/static
COPY --from=compilacao /app/public ./public
COPY --from=compilacao /app/docker ./docker
COPY --from=compilacao /app/src/prisma ./src/prisma
COPY --from=compilacao /app/prisma.config.ts ./prisma.config.ts
# pg + dotenv p/ o migrador (fora da árvore rastreada do standalone;
# ambos sem dependências transitivas, cópia direta basta).
COPY --from=dependencias /app/node_modules/pg ./node_modules/pg
COPY --from=dependencias /app/node_modules/dotenv ./node_modules/dotenv
RUN chmod +x ./docker/app/entrypoint.sh
EXPOSE 3000
CMD ["./docker/app/entrypoint.sh"]
