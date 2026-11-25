# =========================================================================
# Multi-stage Dockerfile para Next.js 15 Standalone con PNPM
# =========================================================================

# 1. Base image con Node.js 22 LTS Alpine (requerido por pnpm@11)
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm@11
WORKDIR /app

# 2. Etapa de dependencias con PNPM
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# 3. Etapa de construcción (Build)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables públicas inyectadas en tiempo de compilación (Next.js NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG NEXT_PUBLIC_STORE_NAME
ARG NEXT_PUBLIC_STORE_ADDRESS
ARG NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER
ENV NEXT_PUBLIC_STORE_NAME=$NEXT_PUBLIC_STORE_NAME
ENV NEXT_PUBLIC_STORE_ADDRESS=$NEXT_PUBLIC_STORE_ADDRESS
ENV NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=$NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY

# Generar cliente Prisma si existe el esquema de base de datos
RUN if [ -f "./prisma/schema.prisma" ]; then pnpm prisma generate; fi

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# 4. Etapa de ejecución (Runner producción ultra ligero)
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl tzdata

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=America/Argentina/Buenos_Aires

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
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN mkdir -p /app/public/uploads/products /app/public/uploads/banners /app/public/uploads/comprobantes \
  && chown -R nextjs:nodejs /app/public/uploads \
  && sed -i 's/\r$//' ./docker-entrypoint.sh \
  && chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]

