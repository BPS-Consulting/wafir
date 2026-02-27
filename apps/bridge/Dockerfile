FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app
RUN pnpm add -g turbo

# Copy pruned workspace
COPY out/json/ .
COPY out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY out/full/ .
COPY turbo.json turbo.json

# Build the application
RUN turbo run build --filter=bridge...

# Deploy the application into a standalone folder
# This command extracts 'bridge' and its production deps into /app/isolated
RUN pnpm --filter=bridge --prod deploy /app/isolated

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify
USER fastify

ENV NODE_ENV=production

# Copy the isolated application
# This now contains REAL files, not symlinks
COPY --from=builder /app/isolated .

# Manually copy the dist folder 
# (pnpm deploy sometimes ignores the dist folder if it's not in the 'files' array of package.json)
COPY --from=builder /app/apps/bridge/dist ./dist

EXPOSE 3000

CMD ["pnpm", "dlx", "fastify-cli", "start", "-l", "info", "-a", "0.0.0.0", "dist/app.js"]