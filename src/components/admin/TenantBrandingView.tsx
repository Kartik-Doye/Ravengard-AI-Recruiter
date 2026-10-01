import React, { useState, useEffect } from "react";
import {
  Palette,
  Globe,
  Mail,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  Eye,
  Sliders,
  FileText
} from "lucide-react";
import { Card } from "../ui/Card";

interface BrandingConfig {
  id: string;
  customDomain: string;
  domainVerified: boolean;
  dnsStatus: string;
  dnsRecords: {
    cname: { host: string; value: string; status: string };
    txt: { host: string; value: string; status: string };
    ssl?: { status: string; validUntil: string };
  };
  brandName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColorHex: string;
  accentColorHex: string;
  candidateAgreementHtml: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSenderEmail: string;
  smtpSenderName: string;
  smtpSecure: boolean;
  smtpVerified: boolean;
}

export function TenantBrandingView() {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states
  const [customDomain, setCustomDomain] = useState("careers.ravengard.ai");
  const [domainVerified, setDomainVerified] = useState(false);
  const [brandName, setBrandName] = useState("Ravengard Talent");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColorHex, setPrimaryColorHex] = useState("#4F46E5");
  const [accentColorHex, setAccentColorHex] = useState("#06B6D4");
  const [candidateAgreement, setCandidateAgreement] = useState(
    "I hereby consent to participate in this AI-assisted structured interview evaluation. All answers are recorded, evaluated against standardized role competencies, and maintained securely under enterprise data privacy regulations."
  );

  // SMTP states
  const [smtpHost, setSmtpHost] = useState("smtp.sendgrid.net");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSenderEmail, setSmtpSenderEmail] = useState("recruiting@ravengard.ai");
  const [smtpSenderName, setSmtpSenderName] = useState("Ravengard Talent Acquisition");
  const [testEmailRecipient, setTestEmailRecipient] = useState("talent.lead@enterprise.corp");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [verifyingDns, setVerifyingDns] = useState(false);

  // Copied states
  const [copiedCname, setCopiedCname] = useState(false);
  const [copiedTxt, setCopiedTxt] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch("/api/admin/whitelabel/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setCustomDomain(data.config.customDomain || "careers.ravengard.ai");
        setDomainVerified(data.config.domainVerified || false);
        setBrandName(data.config.brandName || "Ravengard Talent");
        setLogoUrl(data.config.logoUrl || "");
        setPrimaryColorHex(data.config.primaryColorHex || "#4F46E5");
        setAccentColorHex(data.config.accentColorHex || "#06B6D4");
        setCandidateAgreement(data.config.candidateAgreementHtml || "");
        setSmtpHost(data.config.smtpHost || "smtp.sendgrid.net");
        setSmtpPort(data.config.smtpPort || 587);
        setSmtpSenderEmail(data.config.smtpSenderEmail || "recruiting@ravengard.ai");
        setSmtpSenderName(data.config.smtpSenderName || "Ravengard Talent Acquisition");
      }
    } catch (err) {
      console.error("Failed to load branding config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch("/api/admin/whitelabel/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customDomain,
          brandName,
          logoUrl,
          primaryColorHex,
          accentColorHex,
          candidateAgreementHtml: candidateAgreement,
          smtpHost,
          smtpPort,
          smtpSenderEmail,
          smtpSenderName,
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Tenant whitelabeling parameters saved successfully.", type: "success" });
        setConfig(data.config);
      } else {
        setMessage({ text: data.error || "Failed to save parameters.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error while saving branding.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDns = async () => {
    setVerifyingDns(true);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch("/api/admin/whitelabel/verify-dns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ customDomain })
      });
      const data = await res.json();
      if (data.success) {
        setDomainVerified(true);
        setMessage({ text: data.message, type: "success" });
        fetchConfig();
      } else {
        setMessage({ text: data.error || "DNS verification timed out.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "DNS check error.", type: "error" });
    } finally {
      setVerifyingDns(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch("/api/admin/whitelabel/test-smtp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: testEmailRecipient,
          smtpHost,
          smtpSenderEmail,
          smtpSenderName
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: "success" });
      } else {
        setMessage({ text: data.error || "SMTP test failed.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "SMTP network error.", type: "error" });
    } finally {
      setTestingSmtp(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color preset swatches
  const colorPresets = [
    { name: "Electric Indigo & Cyan", primary: "#4F46E5", accent: "#06B6D4" },
    { name: "Deep Obsidian & Amber", primary: "#D97706", accent: "#10B981" },
    { name: "Enterprise Royal Blue", primary: "#2563EB", accent: "#38BDF8" },
    { name: "Emerald & Slate", primary: "#059669", accent: "#34D399" },
    { name: "Crimson & Rose", primary: "#E11D48", accent: "#FB7185" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Enterprise Branding Suite
            </span>
            <span className="text-slate-400 text-xs font-mono">• Multi-Tenant Whitelabeling</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-light text-slate-100 tracking-wide">
            Tenant Whitelabeling & Custom Domains
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-light mt-1">
            Brand the candidate interview journey with custom DNS routing, corporate colorways, dynamic CSS injection, and dedicated SMTP relay.
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs font-medium transition-colors shadow-sm disabled:opacity-50 shrink-0"
        >
          {saving ? "Saving Changes..." : "Save Branding Suite"}
        </button>
      </div>

      {message && (
        <div className={`p-3.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
          message.type === "success"
            ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
            : "bg-rose-950/40 border-rose-800/60 text-rose-300"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Custom Domain & DNS Card */}
          <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Custom Domain & DNS Verification</span>
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                domainVerified
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {domainVerified ? "DNS Verified · SSL Active" : "Verification Pending"}
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 text-xs font-mono">Candidate Portal Subdomain</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="careers.yourcompany.com"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleVerifyDns}
                  disabled={verifyingDns}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono text-xs border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  {verifyingDns ? "Verifying..." : "Verify DNS"}
                </button>
              </div>
            </div>

            {/* DNS Records Table */}
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">CNAME Record (Routing)</span>
                  <button
                    onClick={() => copyToClipboard("cname.ravengard.ai", setCopiedCname)}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedCname ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Host: {customDomain.split(".")[0] || "careers"}</span>
                  <span className="text-cyan-400">cname.ravengard.ai</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">TXT Verification Record</span>
                  <button
                    onClick={() => copyToClipboard(`rvg_verify_8f7b2c9a1d`, setCopiedTxt)}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedTxt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Host: _ravengard-verify</span>
                  <span className="text-cyan-400 truncate">rvg_verify_8f7b2c9a1d</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Brand Assets & Colors */}
          <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Brand Assets & CSS Colorways</span>
            </h2>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Acme Technologies"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Brand Logo Image URL (PNG / SVG)</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://assets.acme.com/brand/logo.svg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1.5">Primary Brand Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColorHex}
                      onChange={(e) => setPrimaryColorHex(e.target.value)}
                      className="w-9 h-9 rounded border border-slate-700 bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={primaryColorHex}
                      onChange={(e) => setPrimaryColorHex(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5">Accent Color Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColorHex}
                      onChange={(e) => setAccentColorHex(e.target.value)}
                      className="w-9 h-9 rounded border border-slate-700 bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={accentColorHex}
                      onChange={(e) => setAccentColorHex(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Preset Swatches */}
              <div>
                <span className="text-slate-500 text-[11px] block mb-1.5">One-Click Corporate Palettes:</span>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setPrimaryColorHex(p.primary);
                        setAccentColorHex(p.accent);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition-colors"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.primary }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.accent }} />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Candidate Consent Policy & Agreement */}
          <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Custom Candidate Consent Agreement</span>
            </h2>
            <textarea
              value={candidateAgreement}
              onChange={(e) => setCandidateAgreement(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </Card>

          {/* Custom SMTP Gateway Card */}
          <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Custom SMTP Email Dispatch Gateway</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Sender Email</label>
                <input
                  type="email"
                  value={smtpSenderEmail}
                  onChange={(e) => setSmtpSenderEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Sender Display Name</label>
                <input
                  type="text"
                  value={smtpSenderName}
                  onChange={(e) => setSmtpSenderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>

            {/* Test Email Dispatch */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs font-mono">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="test.recipient@enterprise.corp"
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              />
              <button
                onClick={handleTestSmtp}
                disabled={testingSmtp}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded font-mono text-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingSmtp ? "Dispatching..." : "Send Test Invite"}</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Interactive Candidate Portal Preview (6 cols) */}
        <div className="lg:col-span-6 sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Live Injected Candidate Experience Preview</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">Instant CSS Variable Reactivity</span>
          </div>

          {/* Browser Mockup Container with CSS Variables Injected */}
          <div
            className="rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden text-slate-200 transition-all"
            style={
              {
                "--brand-primary": primaryColorHex,
                "--brand-accent": accentColorHex,
              } as React.CSSProperties
            }
          >
            {/* Fake Browser Top Chrome */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              {/* URL Bar */}
              <div className="flex-1 bg-slate-950 px-3 py-1 rounded text-[11px] font-mono text-slate-400 flex items-center gap-1.5 border border-slate-800 truncate">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-slate-200">https://{customDomain || "careers.ravengard.ai"}/assessment/gate</span>
              </div>
            </div>

            {/* Candidate Portal Simulated Screen */}
            <div className="p-6 space-y-6">
              {/* Header with Dynamic Brand Logo / Name */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  {logoUrl ? (
                    <img src={logoUrl} alt={brandName} className="h-7 max-w-[120px] object-contain" />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow"
                      style={{ backgroundColor: "var(--brand-primary)" }}
                    >
                      {brandName.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold text-sm text-slate-100 font-mono tracking-tight">
                    {brandName}
                  </span>
                </div>

                <span
                  className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--brand-accent) 15%, transparent)",
                    color: "var(--brand-accent)",
                    border: "1px solid color-mix(in srgb, var(--brand-accent) 30%, transparent)"
                  }}
                >
                  Candidate Portal
                </span>
              </div>

              {/* Main Candidate Card */}
              <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/60 space-y-4">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block mb-1">
                    Senior Distributed Systems Engineer · Assessment Session
                  </span>
                  <h3 className="text-lg font-light text-slate-100 tracking-tight">
                    Welcome to your {brandName} Technical Interview
                  </h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  You are about to begin a real-time conversational technical evaluation. Sarah will guide you through system architecture challenges and code walk-throughs.
                </p>

                {/* Injected Consent Policy */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed">
                  <span className="text-slate-400 block font-semibold mb-0.5">Corporate Consent Disclaimer:</span>
                  "{candidateAgreement}"
                </div>

                {/* Dynamic Styled Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    className="px-4 py-2 rounded-lg text-white font-mono text-xs font-semibold transition-transform shadow-md"
                    style={{ backgroundColor: "var(--brand-primary)" }}
                  >
                    I Consent & Begin Assessment
                  </button>

                  <button
                    className="px-3.5 py-2 rounded-lg font-mono text-xs font-medium border transition-colors"
                    style={{
                      borderColor: "color-mix(in srgb, var(--brand-accent) 40%, transparent)",
                      color: "var(--brand-accent)",
                      backgroundColor: "color-mix(in srgb, var(--brand-accent) 10%, transparent)"
                    }}
                  >
                    Audio & Mic Test
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-900">
                <span>Powered by {brandName} Recruitment Engine</span>
                <span>Protected by AES-256 Cloud KMS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantBrandingView;
