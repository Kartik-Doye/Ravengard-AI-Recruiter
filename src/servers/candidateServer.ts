import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { createServer as createViteServer } from "vite";
import { correlationIdMiddleware } from "../middleware/correlationId";
import { requestLogger } from "../middleware/requestLogger";
import { errorHandler } from "../middleware/errorHandler";
import cookieParser from "cookie-parser";
import { candidatePortalRouter } from "../routes/candidatePortal";
import { publicJobsRouter } from "../routes/publicJobs";
import candidateRoutes from "../routes/candidate";
import { healthCheckRouter } from "../healthCheck";

export async function createCandidateApp() {
  const app = express();
  app.set("trust proxy", true);

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));
  app.use(cookieParser());
  app.use(correlationIdMiddleware);
  app.use(requestLogger);

  // Rate limiter for candidate operations
  const candidateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests to Candidate Portal, please slow down." }
  });
  app.use("/api/candidate", candidateLimiter);

  // Mount Candidate Portal Endpoints
  app.use("/api/health", healthCheckRouter);
  app.use("/api/public/jobs", publicJobsRouter);
  app.use("/api/candidate", candidatePortalRouter);
  app.use("/api/candidate", candidateRoutes);

  return app;
}

export async function startCandidateServer(port = Number(process.env.PORT_CANDIDATE || process.env.PORT || 3000)) {
  const app = await createCandidateApp();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use(errorHandler);

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`[Candidate Portal] Running at http://0.0.0.0:${port} (Domain: careers.domain.com)`);
  });

  return server;
}

if (process.argv[1]?.endsWith("candidateServer.ts") || process.argv[1]?.endsWith("candidateServer.js")) {
  startCandidateServer();
}
