# Stage 1: Build & Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Runtime Production Image
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy node modules and source code
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/

# Set up logging directory and permissions for non-root node user
RUN mkdir -p logs && chown -R node:node /usr/src/app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
