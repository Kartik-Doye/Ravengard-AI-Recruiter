import type { Request, Response, NextFunction } from "express";

export type TopologyZone = "candidate" | "hr" | "admin" | "gateway";

export interface TopologyOptions {
  zone: TopologyZone;
  strictHostCheck?: boolean;
}

/**
 * Extracts and cleans the incoming Host header without port numbers
 */
export function extractHostname(req: Request): string {
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  return host.split(":")[0].toLowerCase();
}

/**
 * Middleware factory to inspect the Host header and enforce enterprise zone boundaries.
 */
export function createTopologyGuard(options: TopologyOptions) {
  const { zone, strictHostCheck = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const hostname = extractHostname(req);
    const hostWithPort = (req.headers.host || "").toLowerCase();
    const port = hostWithPort.includes(":") ? parseInt(hostWithPort.split(":")[1], 10) : null;
    const isStrict = strictHostCheck || process.env.STRICT_TOPOLOGY === "true";

    // Set zone header on response for audit and observability
    res.setHeader("X-Topology-Zone", zone);

    // Bypass health check endpoints unconditionally
    if (req.path === "/health" || req.path === "/api/health" || req.path === "/api/healthCheck") {
      return next();
    }

    if (zone === "candidate") {
      // Allowed: careers.*, *.run.app, localhost:3000, 127.0.0.1:3000
      const isCareersHost = hostname.startsWith("careers.") || hostname === "careers";
      const isLocalCandidate = port === 3000 || (!port && hostname.includes("localhost"));
      const isCloudRun = hostname.endsWith(".run.app");

      if (isStrict && !isCareersHost && !isLocalCandidate && !isCloudRun) {
        if (hostname.startsWith("hr.") || hostname.startsWith("admin.")) {
          return res.status(403).json({
            error: "Cross-Topology Access Denied",
            message: `Please connect to the designated listener for this service.`,
            zone: "candidate",
            detectedHost: hostname
          });
        }
      }

      return next();
    }

    if (zone === "hr") {
      // Allowed: hr.*, localhost:3001, 127.0.0.1:3001, or VPN domains
      const isHrHost = hostname.startsWith("hr.") || hostname === "hr";
      const isLocalHr = port === 3001 || hostname.includes("hr");
      const isAllowedVpn = hostname.endsWith(".internal") || hostname.endsWith(".vpn") || hostname.endsWith(".corp");

      if (isStrict && !isHrHost && !isLocalHr && !isAllowedVpn) {
        return res.status(403).json({
          error: "HR Workspace Access Restricted",
          message: "Access restricted to internal corporate VPN / hr.* domain.",
          zone: "hr",
          detectedHost: hostname
        });
      }

      return next();
    }

    if (zone === "admin") {
      // Allowed: admin.*, localhost:3002, 127.0.0.1:3002, or CISO network
      const isAdminHost = hostname.startsWith("admin.") || hostname === "admin";
      const isLocalAdmin = port === 3002 || hostname.includes("admin");
      const isAllowedAdminVpn = hostname.endsWith(".ciso") || hostname.endsWith(".sec") || hostname.endsWith(".corp");

      if (isStrict && !isAdminHost && !isLocalAdmin && !isAllowedAdminVpn) {
        return res.status(403).json({
          error: "Enterprise Admin Console Access Restricted",
          message: "Access restricted to authorized CISO / IT administration network / admin.* domain.",
          zone: "admin",
          detectedHost: hostname
        });
      }

      return next();
    }

    return next();
  };
}

export const candidateTopologyGuard = createTopologyGuard({ zone: "candidate" });
export const hrTopologyGuard = createTopologyGuard({ zone: "hr" });
export const adminTopologyGuard = createTopologyGuard({ zone: "admin" });
