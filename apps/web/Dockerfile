# apps/web/Dockerfile
FROM node:24.21.0-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@12.9.1
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY . .
# Build-time placeholders allow config validation. Runtime secrets come from Compose.
ENV AUTH_SECRET=build-only-placeholder-with-32-characters \
    AUTH_URL=https://web.example.com \
    AUTH_KEYCLOAK_ID=web \
    AUTH_KEYCLOAK_SECRET=build-only-placeholder \
    AUTH_KEYCLOAK_ISSUER=https://auth.example.com/realms/demo
RUN pnpm build

FROM node:24.21.0-bookworm-slim AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
RUN groupadd --system --gid 1001 nextjs && useradd --system --uid 1001 --gid nextjs nextjs
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
