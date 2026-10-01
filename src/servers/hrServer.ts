import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { createServer as createViteServer } from "vite";
import { correlationIdMiddleware } from "../middleware/correlationId";
import { requestLogger } from "../middleware/requestLogger";
import { errorHandler } from "../middleware/errorHandler";
import cookieParser from "cookie-parser";
import { hrRouter } from "../routes/hr";
import { authRouter } from "../routes/auth";
import { schedulingRouter } from "../routes/scheduling";
import { integrationsRouter } from "../routes/integrationsRouter";
import { healthCheckRouter } from "../healthCheck";
import { hrTopologyGuard } from "../middleware/topologyGuard";

export async function createHrApp() {
  const app = express();
  app.set("trust proxy", true);

  app.use(hrTopologyGuard);
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));
  app.use(cookieParser());
  app.use(correlationIdMiddleware);
  app.use(requestLogger);

  // Rate limiter for HR operations
  const hrLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 180,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests to HR Workspace, please slow down." }
  });
  app.use("/api/hr", hrLimiter);

  // Mount HR and Hiring Manager Endpoints
  app.use("/api/health", healthCheckRouter);
  app.use("/api/hr", hrRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/scheduling", schedulingRouter);
  app.use("/api/integrations", integrationsRouter);

  return app;
}

export async function startHrServer(port = Number(process.env.PORT_HR || 3001)) {
  const app = await createHrApp();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const buildPath = path.join(process.cwd(), "build");
    app.use(express.static(buildPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(buildPath, "index.html"));
    });
  }

  app.use(errorHandler);

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`[HR Workspace] Running at http://0.0.0.0:${port} (Domain: hr.domain.com)`);
  });

  return server;
}

if (process.argv[1]?.endsWith("hrServer.ts") || process.argv[1]?.endsWith("hrServer.js")) {
  startHrServer();
}
