FROM node:22-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:ts

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npx", "fastify", "start", "-l", "info", "-a", "0.0.0.0", "dist/app.js"]
