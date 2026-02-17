# Build client
FROM node:22-alpine AS client
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY client/ ./
RUN npm run build

# Runtime
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY server/ ./
COPY --from=client /app/client/dist ./client/dist

EXPOSE 3000
CMD ["node", "src/index.js"]
