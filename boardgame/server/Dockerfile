FROM node:14-slim AS builder
WORKDIR /usr/app
COPY server server
COPY src src
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci
RUN npm run build-server

FROM node:14-alpine AS runtime
WORKDIR /usr/app
COPY --from=builder /usr/app/server-build /usr/app/server-build
COPY --from=builder /usr/app/package.json /usr/app/package.json
COPY --from=builder /usr/app/package-lock.json /usr/app/package-lock.json
RUN npm ci --only=production
ENV APP_ENVIRONMENT production
ENTRYPOINT ["node", "server-build/server/server.js"]
