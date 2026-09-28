# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Dev (nodemon + hot reload) ----
FROM base AS dev
ENV NODE_ENV=development
RUN npm ci
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev"]

# ---- Prod ----
FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node src ./src
USER node
EXPOSE 8080
CMD ["node", "src/server.js"]
