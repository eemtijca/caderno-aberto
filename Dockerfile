# Caderno Aberto. Imagem da aplicação (Next.js standalone).
# Multi-estágio para manter a imagem final pequena.

# 1. Dependências (scripts/ junto: o postinstall copia o TikZJax;
# prisma/ junto: o postinstall gera o cliente Prisma)
FROM node:24-bookworm-slim AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY prisma ./prisma
RUN npm ci

# 2. Compilação
FROM node:24-bookworm-slim AS compilacao
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY --from=dependencias /app/generated ./generated
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
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data/imagens && chown node:node /data/imagens
COPY --from=compilacao /app/.next/standalone ./
COPY --from=compilacao /app/.next/static ./.next/static
COPY --from=compilacao /app/public ./public
COPY --from=compilacao /app/docker ./docker
COPY --from=compilacao /app/generated ./generated
COPY --from=compilacao /app/prisma ./prisma
# pg + transitivas + dotenv p/ o migrador (fora da árvore do standalone).
COPY --from=dependencias /app/node_modules/pg ./node_modules/pg
COPY --from=dependencias /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=dependencias /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=dependencias /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=dependencias /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=dependencias /app/node_modules/pgpass ./node_modules/pgpass
COPY --from=dependencias /app/node_modules/pg-int8 ./node_modules/pg-int8
COPY --from=dependencias /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=dependencias /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=dependencias /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=dependencias /app/node_modules/postgres-interval ./node_modules/postgres-interval
COPY --from=dependencias /app/node_modules/split2 ./node_modules/split2
COPY --from=dependencias /app/node_modules/dotenv ./node_modules/dotenv
RUN chmod +x ./docker/app/entrypoint.sh
USER node
EXPOSE 3000
CMD ["./docker/app/entrypoint.sh"]
