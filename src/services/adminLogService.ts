/**
 * adminLogService.ts
 * 
 * Phase 5 & 7 — Integrity Signals & Admin Audit Logs.
 * Integrates free IP reputation and proxy/VPN detection APIs from public-apis (Anti-Malware / Security):
 * - IP-API Proxy & Security Detection (No Auth)
 * 
 * Adheres strictly to Core Integration Guidelines:
 * 1. ZERO SENSITIVE DATA LEAKS: Only client IP address is queried; never candidate PII, transcripts, or credentials.
 * 2. MINIMALIST FETCH: Uses native fetch with 3000ms abort timeout.
 * 3. GRACEFUL FALLBACKS: Silently returns clean default metadata on failure/timeout without interrupting user flows.
 */

import { db } from "../db/index";
import { adminLogs } from "../db/schema";
import { isPrivateIp } from "./deviceCheckService";
import crypto from "crypto";

export interface IpReputationResult {
  isProxyOrVpn: boolean;
  hosting: boolean;
  isp?: string;
  country?: string;
  region?: string;
  city?: string;
  riskScore: number;
}

/**
 * Queries free IP reputation and proxy/VPN detection API.
 */
export async function checkIpReputation(rawIp: string): Promise<IpReputationResult> {
  const cleanIp = (rawIp || '').replace(/^::ffff:/, '').trim();

  // Local / private container IP
  if (isPrivateIp(cleanIp)) {
    return {
      isProxyOrVpn: false,
      hosting: false,
      isp: 'Local Development Network',
      country: 'Internal',
      riskScore: 0
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,message,country,regionName,city,isp,proxy,hosting`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json() as {
        status?: string;
        country?: string;
        regionName?: string;
        city?: string;
        isp?: string;
        proxy?: boolean;
        hosting?: boolean;
      };

      if (data.status === 'success') {
        const isProxyOrVpn = Boolean(data.proxy);
        const hosting = Boolean(data.hosting);
        const riskScore = (isProxyOrVpn ? 70 : 0) + (hosting ? 20 : 0);

        return {
          isProxyOrVpn,
          hosting,
          isp: data.isp,
          country: data.country,
          region: data.regionName,
          city: data.city,
          riskScore
        };
      }
    }
  } catch (err) {
    // API failed or timed out — graceful fallback
  }

  return {
    isProxyOrVpn: false,
    hosting: false,
    riskScore: 0
  };
}

/**
 * Enriched audit logger for administrative actions and security events.
 */
export async function logAdminAudit(params: {
  adminId: string;
  role?: string;
  action: string;
  target?: string;
  metadata?: Record<string, any>;
  requestId?: string;
  ip?: string;
}): Promise<void> {
  try {
    const clientIp = params.ip || '127.0.0.1';
    // Enrich with IP reputation if public IP
    let reputation: IpReputationResult | null = null;
    if (!isPrivateIp(clientIp)) {
      reputation = await checkIpReputation(clientIp);
    }

    await db.insert(adminLogs).values({
      id: crypto.randomUUID(),
      adminId: params.adminId,
      action: params.action,
      target: params.target || null,
      metadata: {
        ...params.metadata,
        role: params.role,
        requestId: params.requestId,
        ip: clientIp,
        reputation: reputation ? {
          isProxyOrVpn: reputation.isProxyOrVpn,
          hosting: reputation.hosting,
          riskScore: reputation.riskScore
        } : undefined
      }
    });
  } catch (error) {
    console.error("Failed to write enriched admin audit log:", error);
  }
}
