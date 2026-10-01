import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { createServer as createViteServer } from "vite";
import { correlationIdMiddleware } from "../middleware/correlationId";
import { requestLogger } from "../middleware/requestLogger";
import { errorHandler } from "../middleware/errorHandler";
import cookieParser from "cookie-parser";
import adminRoutes from "../routes/admin";
import adminFinOpsRouter from "../routes/adminFinOps";
import adminStudioRouter from "../routes/adminStudio";
import { adminIdentityRouter } from "../routes/adminIdentity";
import { adminSecurityRouter } from "../routes/adminSecurity";
import { adminWhitelabelRouter } from "../routes/adminWhitelabel";
import { scimRouter } from "../routes/scimRouter";
import telemetryRouter from "../routes/telemetry";
import { healthCheckRouter } from "../healthCheck";
import { adminTopologyGuard } from "../middleware/topologyGuard";

export async function createAdminApp() {
  const app = express();
  app.set("trust proxy", true);

  app.use(adminTopologyGuard);
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));
  app.use(cookieParser());
  app.use(correlationIdMiddleware);
  app.use(requestLogger);

  // Rate limiter for Admin Console
  const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests to Enterprise Admin Console, please slow down." }
  });
  app.use("/api/admin", adminLimiter);

  // Mount Admin Console Endpoints
  app.use("/api/health", healthCheckRouter);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin", adminFinOpsRouter);
  app.use("/api/admin", adminStudioRouter);
  app.use("/api/admin", adminIdentityRouter);
  app.use("/api/admin", adminSecurityRouter);
  app.use("/api/admin", adminWhitelabelRouter);
  app.use("/scim/v2", scimRouter);
  app.use("/api/telemetry", telemetryRouter);

  return app;
}

export async function startAdminServer(port = Number(process.env.PORT_ADMIN || 3002)) {
  const app = await createAdminApp();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "build");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use(errorHandler);

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`[Admin Console] Running at http://0.0.0.0:${port} (Domain: admin.domain.com)`);
  });

  return server;
}

if (process.argv[1]?.endsWith("adminServer.ts") || process.argv[1]?.endsWith("adminServer.js")) {
  startAdminServer();
}
