FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm install -g pnpm && \
  pnpm install

COPY . .

RUN cd /app/packages/backend && \
  pnpm prisma generate && \
  pnpm run build && \
  cd /app/packages/frontend && \
  pnpm run build

FROM node:20-alpine AS production-stage

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma
COPY packages/backend/entrypoint.sh ./packages/backend/entrypoint.sh

RUN apk add --no-cache gosu && \
  npm install -g pnpm && \
  cd /app/packages/backend && \
  pnpm install --prod --filter backend && \
  pnpm prisma generate && \
  chmod +x /app/packages/backend/entrypoint.sh

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backenduser

COPY --from=build-stage /app/packages/backend/dist /app/packages/backend/dist
COPY --from=build-stage /app/packages/frontend/dist /app/packages/backend/dist/frontend

RUN chown -R backenduser:nodejs /app/packages/backend/

WORKDIR /app/packages/backend

EXPOSE 3499

ENTRYPOINT ["/app/packages/backend/entrypoint.sh"]
