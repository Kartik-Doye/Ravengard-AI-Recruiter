/**
 * Free Public API Integrations for Anti-Fraud, Candidate Portfolio Analysis, Timezone Resolution, & Branding
 */

// 1. Candidate Anti-Abuse: Disposable / Temp Email Check
export async function isDisposableEmail(email: string): Promise<boolean> {
  if (!email || !email.includes("@")) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://disposable.debounce.io/?email=${encodeURIComponent(email)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return false;
    const data = (await res.json()) as { disposable: string };
    return data.disposable === "true";
  } catch {
    // Soft fallback if external API is unreachable or rate limited
    const knownTempDomains = ["tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com", "throwawaymail.com", "yopmail.com"];
    const domain = email.split("@")[1]?.toLowerCase() || "";
    return knownTempDomains.includes(domain);
  }
}

// 2. Candidate Portfolio Auto-Analysis: GitHub REST API
export interface GithubInsights {
  publicRepoCount: number;
  topLanguages: string[];
  totalStars: number;
  recentRepos: Array<{ name: string; description: string | null; language: string | null; stars: number }>;
}

export async function fetchGithubInsights(githubUsername: string): Promise<GithubInsights | null> {
  const cleanUsername = githubUsername.replace(/^@/, "").trim();
  if (!cleanUsername) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=10`, {
      headers: {
        "User-Agent": "Ravengard-AI-Recruiter-Engine",
        Accept: "application/vnd.github.v3+json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const repos = (await res.json()) as any[];
    if (!Array.isArray(repos)) return null;

    const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))] as string[];
    const totalStars = repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);

    return {
      publicRepoCount: repos.length,
      topLanguages: languages,
      totalStars,
      recentRepos: repos.slice(0, 5).map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count || 0,
      })),
    };
  } catch {
    return null;
  }
}

// 3. Timezone & SLA Enforcement: IP Geolocation API
export interface TimezoneLocationInfo {
  timezone: string;
  country: string;
  city?: string;
  ip: string;
}

export async function getCandidateTimezone(ipAddress: string): Promise<TimezoneLocationInfo> {
  const cleanIp = (ipAddress || "").replace(/^::ffff:/, "").trim();

  // If local or private IP, return default UTC
  if (!cleanIp || cleanIp === "127.0.0.1" || cleanIp === "localhost" || cleanIp.startsWith("192.168.") || cleanIp.startsWith("10.")) {
    return {
      timezone: "America/New_York",
      country: "United States",
      city: "New York",
      ip: cleanIp || "127.0.0.1",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(cleanIp)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error("IP API failed");
    const data = (await res.json()) as any;

    if (data.status === "success") {
      return {
        timezone: data.timezone || "UTC",
        country: data.country || "Unknown",
        city: data.city,
        ip: cleanIp,
      };
    }
  } catch {
    // Graceful fallback
  }

  return {
    timezone: "UTC",
    country: "Unknown",
    ip: cleanIp,
  };
}

// 4. Automatic Employer Branding: Clearbit Logo API
export function getCompanyLogoUrl(domainOrName: string): string {
  if (!domainOrName) return "";
  let cleanDomain = domainOrName.toLowerCase().trim();
  cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  if (!cleanDomain.includes(".")) {
    cleanDomain = `${cleanDomain}.com`;
  }

  return `https://logo.clearbit.com/${cleanDomain}`;
}
