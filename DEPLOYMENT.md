# NEXORA ARENA — Production Deployment Guide

This guide details the procedure for deploying NEXORA ARENA to production environments, including Google Cloud Run, Docker containers, and standard Linux hosts.

---

## 1. Architecture Overview

- **Runtime**: Node.js 20+ (LTS) / Express.
- **Frontend**: React 19 SPA built via Vite (`dist/` static bundle).
- **Backend API**: Authoritative game logic, bracket orchestration, telemetry classification, and audit ledger.
- **AI Engine**: Gemini 3.8 Flash (`@google/genai`) running exclusively on the server.
- **Container Port**: Defaults to `3000` (configurable via `PORT` environment variable).

---

## 2. Environment Variables Configuration

Configure the following variables in Google Cloud Secret Manager or your production `.env`:

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | **Yes** | Set to `production` for static asset serving and caching. | `production` |
| `PORT` | **Yes** | Web server listen port (injected by Cloud Run). | `3000` |
| `GEMINI_API_KEY` | **Yes** | API key for FairPlayAnalyzer telemetry evaluation. | `AIzaSy...` |
| `APP_URL` | Optional | Canonical public application URL. | `https://arena.nexora.gg` |
| `RATE_LIMIT_PER_MINUTE` | Optional | Sliding-window request rate limit per IP. | `120` |

---

## 3. Production Build & Local Run

### Step 1: Install Dependencies
```bash
npm ci --only=production=false
```

### Step 2: Build Frontend Bundle
```bash
npm run build
```
This produces optimized production assets inside `/dist`.

### Step 3: Run Full-Stack Production Server
```bash
NODE_ENV=production PORT=3000 node server.ts
```
The server serves compiled static assets from `/dist` and mounts all `/api/*` authoritative game routes on port 3000.

---

## 4. Container Deployment (Docker & Cloud Run)

### Dockerfile
```dockerfile
# Multi-stage production container
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/src/lib ./src/lib

EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
```

### Deploy to Google Cloud Run
```bash
# 1. Build and submit image to Google Artifact Registry
gcloud builds submit --tag gcr.io/[PROJECT_ID]/nexora-arena:latest

# 2. Deploy Cloud Run service
gcloud run deploy nexora-arena \
  --image gcr.io/[PROJECT_ID]/nexora-arena:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets GEMINI_API_KEY=nexora-gemini-key:latest \
  --set-env-vars NODE_ENV=production,RATE_LIMIT_PER_MINUTE=120
```

---

## 5. Security & Production Checklist

1. **Environment Secret Hygiene**: Never hardcode API keys or secret tokens in frontend files.
2. **CORS Hardening**: In high-security multi-domain setups, set `CORS_ALLOWED_ORIGINS` to trusted client domains.
3. **Audit Log Retention**: Ensure database backups are synced with Google Cloud Storage Coldline buckets as detailed in `docs/BACKUP_STRATEGY.md`.
4. **Health Check Probes**: Cloud Run startup and liveness probes target `GET /` and `GET /api/notifications`.
