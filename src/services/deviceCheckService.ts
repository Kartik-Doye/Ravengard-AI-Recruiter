/**
 * deviceCheckService.ts
 * 
 * Phase 2 — Device & Network Geolocation Readiness Utilities.
 * Uses community-curated free public APIs from public-apis (Geocoding / Development):
 * - IP-API (No Auth, free tier)
 * - FreeIPAPI (No Auth fallback)
 * 
 * Adheres strictly to Core Integration Guidelines:
 * 1. ZERO SENSITIVE DATA LEAKS: Only client IP address is used. Never candidate names, resume data, or tokens.
 * 2. MINIMALIST FETCH: Uses native fetch with 3000ms abort signals.
 * 3. GRACEFUL FALLBACKS: Returns safe network metadata on timeout or rate limit; does not block device check.
 */

export interface NetworkReadinessData {
  status: 'verified' | 'fallback' | 'local';
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  isp?: string;
  isLocal: boolean;
  ip?: string;
  latencyAssessment: 'optimal' | 'standard' | 'unverified';
}

/**
 * Checks whether an IP is a private/loopback address.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '').trim();
  if (clean === '127.0.0.1' || clean === '::1' || clean === 'localhost' || clean === '') {
    return true;
  }
  // 10.0.0.0/8
  if (/^10\./.test(clean)) return true;
  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  // 192.168.0.0/16
  if (/^192\.168\./.test(clean)) return true;

  return false;
}

/**
 * Extracts and sanitizes the client IP from request headers or socket.
 */
export function extractClientIp(headers: Record<string, any>, remoteAddress?: string): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const parts = forwarded.split(',');
    return parts[0].trim().replace(/^::ffff:/, '');
  }
  const realIp = headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp.trim().replace(/^::ffff:/, '');
  }
  return (remoteAddress || '127.0.0.1').replace(/^::ffff:/, '').trim();
}

/**
 * Resolves candidate network metadata during Phase 2 Device Check.
 */
export async function getNetworkReadiness(rawIp: string): Promise<NetworkReadinessData> {
  const cleanIp = (rawIp || '').replace(/^::ffff:/, '').trim();

  // If local / container private IP, return immediate local testbed response
  if (isPrivateIp(cleanIp)) {
    return {
      status: 'local',
      country: 'Local Development',
      countryCode: 'DEV',
      region: 'Container Network',
      city: 'Localhost',
      isp: 'Internal Virtual Network',
      isLocal: true,
      ip: cleanIp,
      latencyAssessment: 'optimal'
    };
  }

  // 1. Attempt primary free public API: IP-API (No Auth)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,regionName,city,isp,org`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json() as {
        status?: string;
        country?: string;
        countryCode?: string;
        regionName?: string;
        city?: string;
        isp?: string;
      };

      if (data.status === 'success') {
        return {
          status: 'verified',
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'UN',
          region: data.regionName || 'Unknown',
          city: data.city || 'Unknown',
          isp: data.isp || 'Unknown ISP',
          isLocal: false,
          ip: cleanIp,
          latencyAssessment: 'standard'
        };
      }
    }
  } catch (err) {
    // Primary API timed out or failed
  }

  // 2. Secondary fallback: FreeIPAPI (No Auth)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`https://freeipapi.com/api/json/${cleanIp}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json() as {
        countryName?: string;
        countryCode?: string;
        regionName?: string;
        cityName?: string;
      };

      return {
        status: 'verified',
        country: data.countryName || 'Unknown',
        countryCode: data.countryCode || 'UN',
        region: data.regionName || 'Unknown',
        city: data.cityName || 'Unknown',
        isp: 'Standard Provider',
        isLocal: false,
        ip: cleanIp,
        latencyAssessment: 'standard'
      };
    }
  } catch (err) {
    // Fallback failed or timed out
  }

  // 3. Graceful fallback without blocking the candidate
  return {
    status: 'fallback',
    country: 'Undetected Region',
    countryCode: 'UN',
    region: 'Standard Subnet',
    city: 'Global',
    isp: 'Standard Network Provider',
    isLocal: false,
    ip: cleanIp,
    latencyAssessment: 'unverified'
  };
}
