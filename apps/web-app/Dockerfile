# Stage 1 : Build avec Node.js
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2 : Serveur statique avec nginx
FROM nginx:alpine
LABEL org.opencontainers.image.source https://github.com/StanislasTHBD/collector
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
