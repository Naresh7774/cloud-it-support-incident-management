# Stage 1: Build React Application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Production Web Server
FROM nginx:1.25-alpine

# Copy built static assets from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy internal Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
