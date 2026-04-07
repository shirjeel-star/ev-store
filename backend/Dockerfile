FROM node:20-alpine AS base
WORKDIR /app

# Install deps
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage (includes devDeps for Prisma generate)
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# Runtime
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/generated ./generated
COPY . .

EXPOSE 5000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
