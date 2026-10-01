import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { correlationIdMiddleware } from "./src/middleware/correlationId";
import { requestLogger } from "./src/middleware/requestLogger";
import { errorHandler } from "./src/middleware/errorHandler";
import {
  createTopologyGuard,
  candidateTopologyGuard,
  hrTopologyGuard,
  adminTopologyGuard,
  extractHostname
} from "./src/middleware/topologyGuard";
import { healthCheckRouter } from "./src/healthCheck";

// Import discrete route modules
import { candidatePortalRouter } from "./src/routes/candidatePortal";
import { publicJobsRouter } from "./src/routes/publicJobs";
import candidateRoutes from "./src/routes/candidate";
import { hrRouter } from "./src/routes/hr";
import { authRouter } from "./src/routes/auth";
import { schedulingRouter } from "./src/routes/scheduling";
import { integrationsRouter } from "./src/routes/integrationsRouter";
import adminRoutes from "./src/routes/admin";
import adminFinOpsRouter from "./src/routes/adminFinOps";
import adminStudioRouter from "./src/routes/adminStudio";
import { adminIdentityRouter } from "./src/routes/adminIdentity";
import { adminSecurityRouter } from "./src/routes/adminSecurity";
import { adminWhitelabelRouter } from "./src/routes/adminWhitelabel";
import { scimRouter } from "./src/routes/scimRouter";
import telemetryRouter from "./src/routes/telemetry";

export interface ServerCluster {
  candidateServer: http.Server;
  hrServer?: http.Server;
  adminServer?: http.Server;
}

/**
 * 1. Port 3000: Candidate Portal (Public / External)
 */
export async function createCandidateInstance(): Promise<express.Application> {
  const app = express();
  app.set("trust proxy", 1);
  app.use(candidateTopologyGuard);
  app.use(correlationIdMiddleware);
  app.use(requestLogger);
  app.use(cookieParser());
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Health and public endpoints
  app.use("/api", healthCheckRouter);
  app.use("/health", healthCheckRouter);
  app.use("/api/public/jobs", publicJobsRouter);
  app.use("/api/candidate", candidatePortalRouter);
  app.use("/api/candidate", candidateRoutes);

  // Single-port development fallback: route /hr and /admin paths when accessed in unified dev mode
  app.use("/api/hr", hrRouter);
  app.use("/api/scheduling", schedulingRouter);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin", adminFinOpsRouter);
  app.use("/api/admin", adminStudioRouter);
  app.use("/api/admin", adminIdentityRouter);
  app.use("/api/admin", adminSecurityRouter);
  app.use("/api/admin", adminWhitelabelRouter);
  app.use("/scim/v2", scimRouter);
  app.use("/api/telemetry", telemetryRouter);

  // Vite Dev / Static SPA mount
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), "dist"))
      ? path.join(process.cwd(), "dist")
      : path.join(process.cwd(), "build");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
}

/**
 * 2. Port 3001: HR Workspace (Internal / Corporate VPN)
 */
export async function createHrInstance(): Promise<express.Application> {
  const app = express();
  app.set("trust proxy", 1);
  app.use(hrTopologyGuard);
  app.use(correlationIdMiddleware);
  app.use(requestLogger);
  app.use(cookieParser());
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  app.use("/api", healthCheckRouter);
  app.use("/health", healthCheckRouter);
  app.use("/api/hr", hrRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/scheduling", schedulingRouter);
  app.use("/api/integrations", integrationsRouter);

  if (process.env.NODE_ENV === "production") {
    const distPath = fs.existsSync(path.join(process.cwd(), "dist"))
      ? path.join(process.cwd(), "dist")
      : path.join(process.cwd(), "build");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.use(errorHandler);
  return app;
}

/**
 * 3. Port 3002: Enterprise Admin Console (Restricted CISO/IT)
 */
export async function createAdminInstance(): Promise<express.Application> {
  const app = express();
  app.set("trust proxy", 1);
  app.use(adminTopologyGuard);
  app.use(correlationIdMiddleware);
  app.use(requestLogger);
  app.use(cookieParser());
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  app.use("/api", healthCheckRouter);
  app.use("/health", healthCheckRouter);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin", adminFinOpsRouter);
  app.use("/api/admin", adminStudioRouter);
  app.use("/api/admin", adminIdentityRouter);
  app.use("/api/admin", adminSecurityRouter);
  app.use("/api/admin", adminWhitelabelRouter);
  app.use("/scim/v2", scimRouter);
  app.use("/api/telemetry", telemetryRouter);

  if (process.env.NODE_ENV === "production") {
    const distPath = fs.existsSync(path.join(process.cwd(), "dist"))
      ? path.join(process.cwd(), "dist")
      : path.join(process.cwd(), "build");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.use(errorHandler);
  return app;
}

/**
 * Main Orchestrator: Instantiates and binds the 3 discrete Express instances.
 */
export async function startOrchestrator(): Promise<ServerCluster> {
  const PORT_CANDIDATE = parseInt(process.env.PORT || "3000", 10);
  const PORT_HR = parseInt(process.env.PORT_HR || "3001", 10);
  const PORT_ADMIN = parseInt(process.env.PORT_ADMIN || "3002", 10);

  const candidateApp = await createCandidateInstance();
  const hrApp = await createHrInstance();
  const adminApp = await createAdminInstance();

  const candidateServer = candidateApp.listen(PORT_CANDIDATE, "0.0.0.0", () => {
    console.log(`\n========================================================================`);
    console.log(`  ENTERPRISE SERVER ORCHESTRATOR: MULTI-PORT TOPOLOGY ACTIVE`);
    console.log(`========================================================================`);
    console.log(`  [Port ${PORT_CANDIDATE}] Candidate Portal (Public)       : careers.* / http://localhost:${PORT_CANDIDATE}`);
    console.log(`  [Port ${PORT_HR}] HR Workspace (Corporate VPN)   : hr.* / http://localhost:${PORT_HR}`);
    console.log(`  [Port ${PORT_ADMIN}] Admin Console (Restricted CISO) : admin.* / http://localhost:${PORT_ADMIN}`);
    console.log(`========================================================================\n`);
  });

  let hrServer: http.Server | undefined;
  try {
    hrServer = hrApp.listen(PORT_HR, "0.0.0.0", () => {
      console.log(`[Orchestrator] HR Workspace listener active on port ${PORT_HR}`);
    });
    hrServer.on("error", (err: any) => console.warn(`[HR Listener Notice]: ${err.message}`));
  } catch (e: any) {
    console.warn(`[HR Startup Notice]: ${e.message}`);
  }

  let adminServer: http.Server | undefined;
  try {
    adminServer = adminApp.listen(PORT_ADMIN, "0.0.0.0", () => {
      console.log(`[Orchestrator] Admin Console listener active on port ${PORT_ADMIN}`);
    });
    adminServer.on("error", (err: any) => console.warn(`[Admin Listener Notice]: ${err.message}`));
  } catch (e: any) {
    console.warn(`[Admin Startup Notice]: ${e.message}`);
  }

  return { candidateServer, hrServer, adminServer };
}

if (process.argv[1]?.endsWith("server-orchestrator.ts") || process.argv[1]?.endsWith("server-orchestrator.js")) {
  startOrchestrator();
}
