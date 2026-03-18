FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-slim
LABEL org.opencontainers.image.source=https://github.com/stanthbd/collectorshop
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
CMD ["npm", "start"]
