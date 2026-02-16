########################################
# Stage 1 — Base (common config)
########################################
FROM node:20-alpine AS base

# Instalar dependências necessárias para pacotes nativos
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Ativar Corepack (gerencia pnpm corretamente)
RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

########################################
# Stage 2 — Dependencies
########################################
FROM base AS deps

# Copiar apenas arquivos de dependência
COPY package.json pnpm-lock.yaml ./

# Copiar patches se existirem
COPY patches ./patches

# Instala dependências com lockfile estrito
RUN pnpm install --frozen-lockfile

########################################
# Stage 3 — Build
########################################
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments para variáveis de ambiente necessárias no build
ARG VITE_APP_ID
ARG VITE_APP_LOGO
ARG VITE_APP_TITLE
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_ANALYTICS_ENDPOINT
ARG VITE_ANALYTICS_WEBSITE_ID
ARG VITE_FRONTEND_FORGE_API_KEY
ARG VITE_FRONTEND_FORGE_API_URL

# Exportar como variáveis de ambiente para o build do Vite
ENV VITE_APP_ID=$VITE_APP_ID
ENV VITE_APP_LOGO=$VITE_APP_LOGO
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL
ENV VITE_ANALYTICS_ENDPOINT=$VITE_ANALYTICS_ENDPOINT
ENV VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID
ENV VITE_FRONTEND_FORGE_API_KEY=$VITE_FRONTEND_FORGE_API_KEY
ENV VITE_FRONTEND_FORGE_API_URL=$VITE_FRONTEND_FORGE_API_URL

# Build da aplicação
RUN pnpm run build

########################################
# Stage 4 — Production
########################################
FROM node:20-alpine AS runner

WORKDIR /app

# Ativar Corepack novamente
RUN corepack enable

# Criar usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar apenas o necessário para runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copiar pastas necessárias para runtime
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server
COPY --from=builder /app/storage ./storage

# Ajustar permissões
RUN chown -R appuser:appgroup /app

USER appuser

########################################
# Runtime Config
########################################
ENV NODE_ENV=production
# Easypanel injeta PORT automaticamente, mas definimos 3000 como fallback
ENV PORT=3000

# Expor porta (Easypanel usa a variável PORT)
EXPOSE 3000

########################################
# Healthcheck
########################################
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

########################################
# Start
########################################
# Usar o comando de start do package.json que já está configurado
CMD ["node", "dist/index.js"]
