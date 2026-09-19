/**
 * publicApisIntegration.test.ts
 * 
 * Test suite verifying public utility API integrations from the public-apis directory:
 * 1. Email Verification & Candidate Onboarding (Debounce / Disify / Local blocklist)
 * 2. Device & Network Geolocation Readiness (IP-API / FreeIPAPI)
 * 3. Anti-Cheat IP Reputation & Proxy Detection (IP-API security fields)
 * 4. Network condition testing & timeout fallbacks (using httpbin public mock endpoints)
 */

import { validateCandidateEmail } from "../services/candidateService";
import { getNetworkReadiness, isPrivateIp, extractClientIp } from "../services/deviceCheckService";
import { checkIpReputation } from "../services/adminLogService";

export async function runPublicApiTests() {
  const results: { test: string; passed: boolean; details?: string }[] = [];

  console.log("=================================================");
  console.log("RUNNING PUBLIC UTILITY APIS INTEGRATION TEST SUITE");
  console.log("=================================================\n");

  // --- 1. Email Verification Tests ---
  try {
    console.log("[Phase 1] Testing candidate email validation...");
    
    // Test A: Disposable email (mailinator)
    const disposableCheck = await validateCandidateEmail("candidate.eval@mailinator.com");
    const passedA = disposableCheck.isDisposable === true && disposableCheck.valid === false;
    results.push({
      test: "Phase 1: Block disposable email (mailinator.com)",
      passed: passedA,
      details: `isDisposable=${disposableCheck.isDisposable}, source=${disposableCheck.source}`
    });

    // Test B: Institutional / corporate email
    const validCheck = await validateCandidateEmail("candidate.johnson@alumni.stanford.edu");
    const passedB = validCheck.isDisposable === false && validCheck.valid === true;
    results.push({
      test: "Phase 1: Accept institutional / verified email",
      passed: passedB,
      details: `valid=${validCheck.valid}, domain=${validCheck.domain}`
    });

    // Test C: Malformed email
    const malformedCheck = await validateCandidateEmail("invalid-email-string");
    const passedC = malformedCheck.valid === false && malformedCheck.source === 'format_error';
    results.push({
      test: "Phase 1: Reject malformed email format",
      passed: passedC,
      details: `valid=${malformedCheck.valid}, source=${malformedCheck.source}`
    });
  } catch (err: any) {
    results.push({ test: "Phase 1: Email verification suite", passed: false, details: err.message });
  }

  // --- 2. Device & Network Geolocation Readiness Tests ---
  try {
    console.log("[Phase 2] Testing network geolocation readiness...");

    // Test A: Local/private IP
    const localIpCheck = await getNetworkReadiness("127.0.0.1");
    const passedLocal = localIpCheck.isLocal === true && localIpCheck.status === 'local';
    results.push({
      test: "Phase 2: Private loopback IP recognized as local development network",
      passed: passedLocal,
      details: `status=${localIpCheck.status}, isp=${localIpCheck.isp}`
    });

    // Test B: Public IP geolocation
    const publicIpCheck = await getNetworkReadiness("8.8.8.8");
    const passedPublic = publicIpCheck.status === 'verified' && Boolean(publicIpCheck.country);
    results.push({
      test: "Phase 2: Public IP geolocation successfully resolved",
      passed: passedPublic,
      details: `country=${publicIpCheck.country}, isp=${publicIpCheck.isp}`
    });

    // Test C: IP extraction utility
    const mockHeaders = { "x-forwarded-for": "203.0.113.195, 10.0.0.1" };
    const extractedIp = extractClientIp(mockHeaders);
    results.push({
      test: "Phase 2: Extract real client IP from forwarded header",
      passed: extractedIp === "203.0.113.195",
      details: `extractedIp=${extractedIp}`
    });
  } catch (err: any) {
    results.push({ test: "Phase 2: Geolocation readiness suite", passed: false, details: err.message });
  }

  // --- 3. Anti-Cheat IP Reputation & Proxy Detection Tests ---
  try {
    console.log("[Phase 5 & 7] Testing IP reputation & proxy detection...");

    // Test A: Local IP reputation
    const localRep = await checkIpReputation("127.0.0.1");
    results.push({
      test: "Phase 5 & 7: Local IP safe zero-risk reputation score",
      passed: localRep.isProxyOrVpn === false && localRep.riskScore === 0,
      details: `riskScore=${localRep.riskScore}`
    });

    // Test B: Public IP security assessment
    const publicRep = await checkIpReputation("8.8.8.8");
    results.push({
      test: "Phase 5 & 7: Public IP reputation analysis",
      passed: typeof publicRep.riskScore === 'number' && typeof publicRep.isProxyOrVpn === 'boolean',
      details: `isProxyOrVpn=${publicRep.isProxyOrVpn}, hosting=${publicRep.hosting}, riskScore=${publicRep.riskScore}`
    });
  } catch (err: any) {
    results.push({ test: "Phase 5 & 7: IP reputation suite", passed: false, details: err.message });
  }

  // --- 4. Mock Endpoint Resilience & Graceful Timeout Handling ---
  try {
    console.log("[Mocking & Resilience] Testing public mock endpoints & timeout resilience...");

    // Test A: Public mock endpoint connectivity (httpbin.org)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const mockRes = await fetch("https://httpbin.org/get", { signal: controller.signal });
    clearTimeout(timeoutId);
    
    results.push({
      test: "Mocking: Public mock endpoint reachable (httpbin.org)",
      passed: mockRes.ok,
      details: `status=${mockRes.status}`
    });

    // Test B: Forced 100ms timeout abort validation
    const fastController = new AbortController();
    const fastTimeout = setTimeout(() => fastController.abort(), 100);
    let abortedCleanly = false;
    try {
      // Intentionally request a 1-second delay with a 100ms client timeout
      await fetch("https://httpbin.org/delay/1", { signal: fastController.signal });
    } catch (abortErr) {
      abortedCleanly = true;
    } finally {
      clearTimeout(fastTimeout);
    }

    results.push({
      test: "Mocking: Timeout resilience aborts hanging connections gracefully",
      passed: abortedCleanly,
      details: "Timed out connection was aborted within budget without uncaught exception"
    });
  } catch (err: any) {
    results.push({ test: "Mocking & Resilience: httpbin suite", passed: false, details: err.message });
  }

  // --- Summary ---
  console.log("\n=================================================");
  console.log("TEST RESULTS SUMMARY");
  console.log("=================================================");
  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`[${symbol}] ${r.test}`);
    if (r.details) console.log(`       Details: ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log("=================================================\n");

  return allPassed;
}
