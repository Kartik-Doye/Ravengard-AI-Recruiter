# Ravengard AI Recruiter - Operational Runbook

## 1. Deployment Guide
- **Frontend:** Run `npm run build` to compile the React application.
- **Backend:** The server is bundled using esbuild (`npm run build`). Start with `npm run start`.
- **Environment:** Ensure `.env` includes `GEMINI_API_KEY` and DB credentials.

## 2. Monitoring & Alerting
- Monitor WebSocket connection stability.
- Track 5xx errors on the Express backend.
- Set alerts for Gemini API rate limit exceptions.

## 3. Incident Response
- **P0 (Platform Down):** Check database connectivity and Node.js process health. Restart containers.
- **P1 (Interview Flow Broken):** Inspect Gemini Live API connectivity and WebSocket states.
- **P2 (Anti-Cheat False Positives):** Review heuristic thresholds in the frontend code.

## 4. Disaster Recovery
- Regular SQLite/PostgreSQL backups.
- If AI latency spikes, fall back to simplified prompts or cached responses for static phases.
