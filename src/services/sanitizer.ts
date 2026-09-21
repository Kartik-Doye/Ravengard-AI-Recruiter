/**
 * Server-Side Sanitization and Input Validation Service
 * 
 * Protects candidate registration endpoints against:
 * - Stored and Reflected Cross-Site Scripting (XSS)
 * - Null byte injection (\0) and C-string termination exploits
 * - Malformed input / buffer exhaustion (DoS)
 * - Unicode Directional Formatting (BIDI attacks)
 * - SQL / NoSQL / Command injection payloads
 * - Header injection (CRLF in email fields)
 */

export interface SanitizedCandidateRegistration {
  name: string;
  email: string;
  mobile: string;
  college: string;
  degree: string;
  gradYear: number;
  preferredLanguage: string;
  resumeText?: string;
  requisitionId?: string;
  jobId?: string;
}

export interface SanitizationResult {
  success: boolean;
  data?: SanitizedCandidateRegistration;
  errors: string[];
}

/**
 * Strips null characters, control characters, and Unicode BIDI directional overrides.
 */
export function stripNullAndControlChars(input: string, allowNewlinesAndTabs = false): string {
  if (!input || typeof input !== 'string') return '';

  // 1. Strip null bytes
  let cleaned = input.replace(/\0/g, '').replace(/\\0/g, '');

  // 2. Strip Unicode BIDI directional override characters
  // \u200E (LRM), \u200F (RLM), \u202A-\u202E (LRE, RLE, PDF, LRO, RLO), \u2066-\u2069 (LRI, RLI, FSI, PDI)
  cleaned = cleaned.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');

  // 3. Strip ASCII control characters (0-31 and 127)
  if (allowNewlinesAndTabs) {
    // Preserve \t (\x09), \n (\x0A), \r (\x0D)
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  }

  return cleaned.trim();
}

/**
 * Checks for known active XSS and script injection patterns.
 */
export function hasMaliciousScriptPayload(input: string): { dangerous: boolean; reason?: string } {
  if (!input || typeof input !== 'string') return { dangerous: false };

  // Case-insensitive checks for script tags, event handlers, and active pseudo-protocols
  const scriptTagRegex = /<\s*script[^>]*>[\s\S]*?(?:<\s*\/\s*script\s*>|$)/i;
  const genericTagRegex = /<\s*(?:iframe|object|embed|applet|style|form|svg|meta|link|base)[^>]*>/i;
  const eventHandlerRegex = /\bon[a-z]{3,20}\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/i;
  const javascriptSchemeRegex = /(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i;
  const dangerousEntityRegex = /&#(?:x[0-9a-f]+|[0-9]+);?/i;

  if (scriptTagRegex.test(input)) {
    return { dangerous: true, reason: "Embedded <script> tags are strictly prohibited." };
  }
  if (genericTagRegex.test(input)) {
    return { dangerous: true, reason: "Embedded HTML/XML tags (iframe, object, embed, svg, etc.) are strictly prohibited." };
  }
  if (eventHandlerRegex.test(input)) {
    return { dangerous: true, reason: "Inline event handlers (onload, onerror, onclick, etc.) are strictly prohibited." };
  }
  if (javascriptSchemeRegex.test(input)) {
    return { dangerous: true, reason: "JavaScript or executable URI schemes are strictly prohibited." };
  }

  return { dangerous: false };
}

/**
 * Strips HTML tags from text.
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/<[^>]*>/g, ''); // Second pass to catch double-encoded or stripped tags
}

/**
 * Escapes characters to prevent stored XSS if rendered in HTML contexts.
 */
export function escapeHtmlEntities(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and sanitizes a candidate's full name.
 */
export function sanitizeName(raw: unknown): { value?: string; error?: string } {
  if (typeof raw !== 'string') {
    return { error: "Full Name is required and must be a string." };
  }

  const cleaned = stripNullAndControlChars(raw, false);
  if (cleaned.length < 2) {
    return { error: "Full Name must be at least 2 characters long." };
  }
  if (cleaned.length > 100) {
    return { error: "Full Name cannot exceed 100 characters." };
  }

  const scriptCheck = hasMaliciousScriptPayload(cleaned);
  if (scriptCheck.dangerous) {
    return { error: `Full Name contains prohibited script content: ${scriptCheck.reason}` };
  }

  // Allow standard human name characters including unicode international letters, hyphens, periods, spaces, apostrophes
  const safeNameRegex = /^[\p{L}\p{M}\s.'\-]+$/u;
  if (!safeNameRegex.test(cleaned)) {
    return { error: "Full Name contains invalid symbols or numbers. Only letters, spaces, hyphens, and apostrophes are permitted." };
  }

  return { value: cleaned };
}

/**
 * Validates and sanitizes candidate email address.
 * Prevents SMTP header injection (CRLF), script tags, and malformed domain structures.
 */
export function sanitizeEmail(raw: unknown): { value?: string; error?: string } {
  if (typeof raw !== 'string') {
    return { error: "Email Address is required and must be a string." };
  }

  // Prevent CRLF injection
  if (/[\r\n]/.test(raw)) {
    return { error: "Email Address contains invalid newline or carriage return characters." };
  }

  const cleaned = stripNullAndControlChars(raw, false).toLowerCase();
  if (cleaned.length < 5) {
    return { error: "Email Address must be at least 5 characters." };
  }
  if (cleaned.length > 254) {
    return { error: "Email Address cannot exceed 254 characters (RFC 5321)." };
  }

  const scriptCheck = hasMaliciousScriptPayload(cleaned);
  if (scriptCheck.dangerous) {
    return { error: "Email Address contains prohibited characters or script tags." };
  }

  // Strict email syntax validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleaned)) {
    return { error: "Please enter a valid email address (e.g. candidate@university.edu)." };
  }

  return { value: cleaned };
}

/**
 * Validates and sanitizes mobile phone number.
 * Only allows digits, spaces, parentheses, hyphens, dots, and optional leading +.
 * Rejects any embedded characters, SQL injection tokens, or scripts.
 */
export function sanitizeMobile(raw: unknown): { value?: string; error?: string } {
  if (typeof raw !== 'string') {
    return { error: "Mobile number is required and must be a string." };
  }

  const cleaned = stripNullAndControlChars(raw, false);
  const scriptCheck = hasMaliciousScriptPayload(cleaned);
  if (scriptCheck.dangerous) {
    return { error: "Mobile number contains prohibited characters or script tags." };
  }

  // Check for invalid characters (letters, SQL symbols, tags, etc.)
  const phoneCharRegex = /^[+]?[0-9\s\-().]{10,25}$/;
  if (!phoneCharRegex.test(cleaned)) {
    return { error: "Please enter a valid 10-digit phone number without illegal characters." };
  }

  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { error: "Please enter a valid 10-digit phone number (10 to 15 digits required)." };
  }

  return { value: cleaned };
}

/**
 * Validates and sanitizes College / University name.
 */
export function sanitizeCollege(raw: unknown): { value?: string; error?: string } {
  if (typeof raw !== 'string') {
    return { error: "College or University is required and must be a string." };
  }

  const cleaned = stripNullAndControlChars(raw, false);
  if (cleaned.length < 2) {
    return { error: "College or University must be at least 2 characters." };
  }
  if (cleaned.length > 150) {
    return { error: "College or University cannot exceed 150 characters." };
  }

  const scriptCheck = hasMaliciousScriptPayload(cleaned);
  if (scriptCheck.dangerous) {
    return { error: `College or University contains prohibited script content: ${scriptCheck.reason}` };
  }

  // Allow letters, numbers, spaces, commas, periods, hyphens, parentheses, ampersand, apostrophes
  const safeInstRegex = /^[\p{L}\p{N}\s,.'&()\-]+$/u;
  if (!safeInstRegex.test(cleaned)) {
    return { error: "College or University contains invalid symbols or code characters." };
  }

  return { value: cleaned };
}

/**
 * Validates and sanitizes Degree name.
 */
export function sanitizeDegree(raw: unknown): { value?: string; error?: string } {
  if (typeof raw !== 'string') {
    return { error: "Degree is required and must be a string." };
  }

  const cleaned = stripNullAndControlChars(raw, false);
  if (cleaned.length < 2) {
    return { error: "Degree must be at least 2 characters." };
  }
  if (cleaned.length > 150) {
    return { error: "Degree cannot exceed 150 characters." };
  }

  const scriptCheck = hasMaliciousScriptPayload(cleaned);
  if (scriptCheck.dangerous) {
    return { error: `Degree contains prohibited script content: ${scriptCheck.reason}` };
  }

  // Allow letters, numbers, spaces, commas, periods, hyphens, parentheses, ampersand, slash
  const safeDegreeRegex = /^[\p{L}\p{N}\s,.'&()/\-]+$/u;
  if (!safeDegreeRegex.test(cleaned)) {
    return { error: "Degree contains invalid symbols or code characters." };
  }

  return { value: cleaned };
}

/**
 * Validates and sanitizes Graduation Year.
 */
export function sanitizeGradYear(raw: unknown): { value?: number; error?: string } {
  if (raw === undefined || raw === null || raw === '') {
    return { error: "Graduation Year is required." };
  }

  const parsed = typeof raw === 'number' ? raw : parseInt(String(raw).trim(), 10);
  if (isNaN(parsed) || !Number.isInteger(parsed) || !Number.isFinite(parsed)) {
    return { error: "Graduation Year must be a valid 4-digit year." };
  }

  if (parsed < 1950 || parsed > 2100) {
    return { error: "Graduation Year must be between 1950 and 2100." };
  }

  return { value: parsed };
}

/**
 * Validates and sanitizes Preferred Language.
 */
export function sanitizePreferredLanguage(raw: unknown): { value?: string; error?: string } {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { value: 'English' };
  }

  const cleaned = stripNullAndControlChars(raw, false);
  if (cleaned.length > 50) {
    return { error: "Preferred Language cannot exceed 50 characters." };
  }

  const scriptCheck = hasMaliciousScriptPayload(cleaned);
  if (scriptCheck.dangerous) {
    return { error: "Preferred Language contains prohibited script characters." };
  }

  const safeLangRegex = /^[\p{L}\s\-()]+$/u;
  if (!safeLangRegex.test(cleaned)) {
    return { error: "Preferred Language contains invalid characters." };
  }

  return { value: cleaned };
}

/**
 * Sanitizes attached raw resume text if uploaded.
 * Caps size at 200KB, strips null bytes and script tags, normalizes whitespace.
 */
export function sanitizeResumeText(raw: unknown): { value?: string; error?: string } {
  if (!raw) return { value: undefined };
  if (typeof raw !== 'string') {
    return { error: "Resume text payload must be a string." };
  }

  // Max 200KB string length
  if (raw.length > 200000) {
    return { error: "Resume text exceeds the maximum allowable payload size (200KB limit)." };
  }

  // Strip null bytes and control characters while preserving newlines and tabs
  let cleaned = stripNullAndControlChars(raw, true);

  // Strip active script tags, iframes, styles
  cleaned = cleaned.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');
  cleaned = cleaned.replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '');
  cleaned = cleaned.replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '');
  cleaned = cleaned.replace(/<\s*(?:object|embed|applet)[^>]*>[\s\S]*?<\s*\/\s*(?:object|embed|applet)\s*>/gi, '');

  return { value: cleaned };
}

/**
 * Validates and sanitizes optional UUID / alphanumeric identifier (requisitionId or jobId).
 */
export function sanitizeIdentifier(raw: unknown): { value?: string; error?: string } {
  if (!raw) return { value: undefined };
  if (typeof raw !== 'string') {
    return { error: "Identifier must be a valid string." };
  }

  const cleaned = stripNullAndControlChars(raw, false);
  if (cleaned.length === 0) return { value: undefined };

  if (cleaned.length > 64) {
    return { error: "Identifier exceeds maximum allowable length of 64 characters." };
  }

  // Strictly alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_\-]+$/.test(cleaned)) {
    return { error: "Identifier contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed." };
  }

  return { value: cleaned };
}

/**
 * Master sanitization and validation function for Candidate Registration endpoint.
 * Ensures every incoming field is sanitized, stripped of malicious vectors, and strictly validated
 * before touching the database.
 */
export function sanitizeCandidateRegistrationInput(body: any): SanitizationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      success: false,
      errors: ["Invalid request payload: Request body must be a JSON object."]
    };
  }

  const errors: string[] = [];

  const nameRes = sanitizeName(body.name);
  if (nameRes.error) errors.push(nameRes.error);

  const emailRes = sanitizeEmail(body.email);
  if (emailRes.error) errors.push(emailRes.error);

  const mobileRes = sanitizeMobile(body.mobile);
  if (mobileRes.error) errors.push(mobileRes.error);

  const collegeRes = sanitizeCollege(body.college);
  if (collegeRes.error) errors.push(collegeRes.error);

  const degreeRes = sanitizeDegree(body.degree);
  if (degreeRes.error) errors.push(degreeRes.error);

  const gradYearRes = sanitizeGradYear(body.gradYear);
  if (gradYearRes.error) errors.push(gradYearRes.error);

  const langRes = sanitizePreferredLanguage(body.preferredLanguage);
  if (langRes.error) errors.push(langRes.error);

  const resumeTextRes = sanitizeResumeText(body.resumeText || body.rawResumeText);
  if (resumeTextRes.error) errors.push(resumeTextRes.error);

  const reqIdRes = sanitizeIdentifier(body.requisitionId);
  if (reqIdRes.error) errors.push(reqIdRes.error);

  const jobIdRes = sanitizeIdentifier(body.jobId);
  if (jobIdRes.error) errors.push(jobIdRes.error);

  if (errors.length > 0) {
    return {
      success: false,
      errors
    };
  }

  return {
    success: true,
    data: {
      name: nameRes.value!,
      email: emailRes.value!,
      mobile: mobileRes.value!,
      college: collegeRes.value!,
      degree: degreeRes.value!,
      gradYear: gradYearRes.value!,
      preferredLanguage: langRes.value || 'English',
      resumeText: resumeTextRes.value,
      requisitionId: reqIdRes.value,
      jobId: jobIdRes.value
    }
  };
}
