FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/build ./build
RUN npm ci --omit=dev

# Multi-Port Expose:
# 3000: Candidate Portal (External / Public)
# 3001: HR & Hiring Manager Workspace (Internal Corporate VPN)
# 3002: Enterprise Admin Console (Restricted CISO/IT)
EXPOSE 3000 3001 3002

ENV PORT=3000
ENV PORT_HR=3001
ENV PORT_ADMIN=3002

CMD ["npm", "start"]
