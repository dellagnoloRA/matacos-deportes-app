# =========================================================================
# Multi-stage Dockerfile para Next.js 15 Standalone con PNPM
# =========================================================================

# 1. Base image con Node.js 20 LTS Alpine
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# 2. Etapa de dependencias con PNPM
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# 3. Etapa de construcción (Build)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma si existe el esquema de base de datos
RUN if [ -f "./prisma/schema.prisma" ]; then pnpm prisma generate; fi

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# 4. Etapa de ejecución (Runner producción ultra ligero)
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar Prisma CLI globalmente para permitir migraciones offline sin depender de internet
RUN npm install -g prisma@6.19.3

# Crear usuario sin privilegios root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos estáticos, build standalone generado y esquema/migraciones de Prisma
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

