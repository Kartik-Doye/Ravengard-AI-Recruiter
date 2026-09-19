/**
 * candidateService.ts
 * 
 * Phase 1 — Email Verification & Candidate Onboarding Utilities.
 * Uses community-curated free public APIs from public-apis (Data Validation / Anti-Malware):
 * - Debounce Disposable API (No Auth)
 * - Disify Disposable API (No Auth)
 * 
 * Adheres strictly to Core Integration Guidelines:
 * 1. ZERO SENSITIVE DATA LEAKS: Only the email address or domain is checked; never PII, resume data, or tokens.
 * 2. MINIMALIST FETCH: Uses native Node/browser fetch without third-party wrapper dependencies.
 * 3. GRACEFUL FALLBACKS: Uses strict 3000ms timeouts with local domain blocklist fallback.
 */

export interface EmailValidationResult {
  valid: boolean;
  isDisposable: boolean;
  domain: string;
  source: 'api_debounce' | 'api_disify' | 'local_fallback' | 'format_error';
  reason?: string;
}

// Local fallback blocklist of known disposable / burner email domains
const LOCAL_DISPOSABLE_DOMAINS = new Set<string>([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'sharklasers.com',
  'grr.la',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'dispostable.com',
  'trashmail.com',
  'trashmail.net',
  'getairmail.com',
  'fakeinbox.com',
  'maildrop.cc',
  'mytemp.email',
  'burnermail.io',
  'mohmal.com'
]);

/**
 * Validates candidate email address against free public disposable email APIs.
 * Blocks burner and temporary accounts to preserve interview integrity.
 */
export async function validateCandidateEmail(email: string): Promise<EmailValidationResult> {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      isDisposable: false,
      domain: '',
      source: 'format_error',
      reason: 'Email is required and must be a string.'
    };
  }

  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) {
    return {
      valid: false,
      isDisposable: false,
      domain: parts[1] || '',
      source: 'format_error',
      reason: 'Invalid email address format.'
    };
  }

  const domain = parts[1];

  // Quick pre-check against local blocklist
  if (LOCAL_DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      isDisposable: true,
      domain,
      source: 'local_fallback',
      reason: 'Disposable or temporary email provider detected.'
    };
  }

  // 1. Attempt primary free public API: Debounce Disposable Email API (No Auth)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`https://disposable.debounce.io/?email=${encodeURIComponent(normalized)}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json() as { disposable?: string | boolean };
      const isDisposable = data.disposable === 'true' || data.disposable === true;
      return {
        valid: !isDisposable,
        isDisposable,
        domain,
        source: 'api_debounce',
        reason: isDisposable ? 'Disposable or temporary email address detected by verification service.' : undefined
      };
    }
  } catch (err) {
    // Primary API timed out or errored; proceed to secondary fallback
  }

  // 2. Attempt secondary free public API: Disify API (No Auth)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`https://www.disify.com/api/email/${encodeURIComponent(normalized)}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json() as { disposable?: boolean; format?: boolean };
      if (data.format === false) {
        return {
          valid: false,
          isDisposable: false,
          domain,
          source: 'api_disify',
          reason: 'Email format rejected by verification authority.'
        };
      }
      const isDisposable = Boolean(data.disposable);
      return {
        valid: !isDisposable,
        isDisposable,
        domain,
        source: 'api_disify',
        reason: isDisposable ? 'Disposable or temporary email address detected by verification service.' : undefined
      };
    }
  } catch (err) {
    // Secondary API timed out or errored
  }

  // 3. Graceful fallback: If public APIs are unreachable or rate-limited, fail open unless matched by local rules
  return {
    valid: true,
    isDisposable: false,
    domain,
    source: 'local_fallback'
  };
}
