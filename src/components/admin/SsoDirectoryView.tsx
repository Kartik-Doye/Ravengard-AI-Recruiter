import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Key,
  Users,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Play,
  FileCode,
  Download,
  AlertCircle,
  Plus,
  Trash2,
  Cpu
} from "lucide-react";
import { Card } from "../ui/Card";

interface SsoConfig {
  id: string;
  providerType: string;
  entityId: string;
  signOnUrl: string;
  x509Certificate: string | null;
  issuerUrl: string | null;
  clientId: string | null;
  clientSecret: string | null;
  enabled: boolean;
  mfaPolicy: string;
  allowedDomains: string[];
  attributeMapping: {
    email: string;
    name: string;
    role: string;
  };
}

interface ScimToken {
  id: string;
  name: string;
  permissions: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

interface SyncLog {
  id: string;
  provider: string;
  action: string;
  email: string | null;
  status: string;
  details: string;
  createdAt: string;
}

export function SsoDirectoryView() {
  const [activeTab, setActiveTab] = useState<"saml" | "sandbox" | "scim" | "mfa">("saml");
  const [config, setConfig] = useState<SsoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Copied states
  const [copiedAcs, setCopiedAcs] = useState(false);
  const [copiedEntity, setCopiedEntity] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [newRawToken, setNewRawToken] = useState<string | null>(null);

  // Form states
  const [providerType, setProviderType] = useState("SAML_2_0");
  const [signOnUrl, setSignOnUrl] = useState("");
  const [issuerUrl, setIssuerUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [x509Cert, setX509Cert] = useState("");
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [mfaPolicy, setMfaPolicy] = useState("TOTP");

  // Sandbox states
  const [sandboxProvider, setSandboxProvider] = useState("OKTA");
  const [sandboxEmail, setSandboxEmail] = useState("lead.auditor@enterprise.corp");
  const [sandboxName, setSandboxName] = useState("Morgan Vance");
  const [sandboxGroups, setSandboxGroups] = useState("HR_Recruiters, Ravengard_Admins");
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // SCIM states
  const [tokens, setTokens] = useState<ScimToken[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [newTokenName, setNewTokenName] = useState("Okta SCIM Production Connector");
  const [syncing, setSyncing] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch("/api/admin/identity/sso-config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setProviderType(data.config.providerType || "SAML_2_0");
        setSignOnUrl(data.config.signOnUrl || "");
        setIssuerUrl(data.config.issuerUrl || "");
        setClientId(data.config.clientId || "");
        setClientSecret(data.config.clientSecret || "");
        setX509Cert(data.config.x509Certificate || "");
        setAllowedDomains(data.config.allowedDomains || ["ravengard.com"]);
        setMfaPolicy(data.config.mfaPolicy || "TOTP");
      }
    } catch (err) {
      console.error("Failed to load SSO config:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScimData = async () => {
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const [tokenRes, logsRes] = await Promise.all([
        fetch("/api/admin/identity/scim/tokens", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/identity/scim/logs", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const tokenData = await tokenRes.json();
      const logsData = await logsRes.json();
      if (tokenData.success) setTokens(tokenData.tokens || []);
      if (logsData.success) setSyncLogs(logsData.logs || []);
    } catch (err) {
      console.error("Failed to load SCIM data:", err);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchScimData();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch("/api/admin/identity/sso-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          providerType,
          signOnUrl,
          issuerUrl,
          clientId,
          clientSecret,
          x509Certificate: x509Cert,
          allowedDomains,
          mfaPolicy,
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Enterprise SSO parameters updated successfully.", type: "success" });
        setConfig(data.config);
      } else {
        setMessage({ text: data.error || "Failed to update configuration.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Connection error while updating SSO.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    setSandboxResult(null);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const groupsArray = sandboxGroups.split(",").map(g => g.trim()).filter(Boolean);
      const res = await fetch("/api/admin/identity/sandbox/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          provider: sandboxProvider,
          testEmail: sandboxEmail,
          testName: sandboxName,
          testGroups: groupsArray
        })
      });
      const data = await res.json();
      if (data.success) {
        setSandboxResult(data.simulation);
      }
    } catch (err) {
      console.error("Sandbox simulation failed:", err);
    } finally {
      setSandboxRunning(false);
    }
  };

  const handleCreateScimToken = async () => {
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch("/api/admin/identity/scim/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTokenName })
      });
      const data = await res.json();
      if (data.success) {
        setNewRawToken(data.rawBearerToken);
        fetchScimData();
      }
    } catch (err) {
      console.error("Token creation error:", err);
    }
  };

  const handleRevokeToken = async (id: string) => {
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      await fetch(`/api/admin/identity/scim/tokens/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchScimData();
    } catch (err) {
      console.error("Revocation error:", err);
    }
  };

  const handleTriggerSyncNow = async () => {
    setSyncing(true);
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      const res = await fetch("/api/admin/identity/scim/sync-now", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: "success" });
        fetchScimData();
      }
    } catch (err) {
      setMessage({ text: "Failed to trigger directory sync.", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddDomain = () => {
    if (!newDomain.trim() || allowedDomains.includes(newDomain.trim().toLowerCase())) return;
    setAllowedDomains([...allowedDomains, newDomain.trim().toLowerCase()]);
    setNewDomain("");
  };

  const handleRemoveDomain = (d: string) => {
    setAllowedDomains(allowedDomains.filter(dom => dom !== d));
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const spEntityId = "https://ravengard.ai/saml/metadata";
  const spAcsUrl = "https://ravengard.ai/api/admin/auth/saml/acs";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Identity Management V2
            </span>
            <span className="text-slate-400 text-xs font-mono">• SAML 2.0 / OIDC / SCIM 2.0</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-light text-slate-100 tracking-wide">
            Enterprise Single Sign-On & Directory Sync
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-light mt-1">
            Enforce corporate identity federation across Okta, Microsoft Entra ID, and Google Workspace with automated SCIM provisioning and hardware MFA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/admin/identity/saml/metadata.xml"
            download="ravengard_sp_metadata.xml"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SP XML</span>
          </a>
        </div>
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

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab("saml")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === "saml" ? "bg-white text-slate-950 font-semibold shadow-sm" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>SAML 2.0 & OIDC Setup</span>
        </button>
        <button
          onClick={() => setActiveTab("sandbox")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === "sandbox" ? "bg-white text-slate-950 font-semibold shadow-sm" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Built-in IdP Sandbox</span>
        </button>
        <button
          onClick={() => setActiveTab("scim")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === "scim" ? "bg-white text-slate-950 font-semibold shadow-sm" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>SCIM 2.0 Directory Sync</span>
        </button>
        <button
          onClick={() => setActiveTab("mfa")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === "mfa" ? "bg-white text-slate-950 font-semibold shadow-sm" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>MFA & Access Policies</span>
        </button>
      </div>

      {/* TAB 1: SAML & OIDC Setup */}
      {activeTab === "saml" && (
        <div className="space-y-6">
          {/* Service Provider Credentials Card */}
          <Card className="p-5 border-slate-800 bg-slate-900/50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Ravengard Service Provider (SP) Metadata</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1 text-[11px]">SP Entity ID / Audience URI</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-200 truncate">{spEntityId}</span>
                  <button
                    onClick={() => copyToClipboard(spEntityId, setCopiedEntity)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedEntity ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1 text-[11px]">Assertion Consumer Service (ACS) URL</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-200 truncate">{spAcsUrl}</span>
                  <button
                    onClick={() => copyToClipboard(spAcsUrl, setCopiedAcs)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedAcs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Identity Provider Configuration Form */}
          <Card className="p-5 border-slate-800 bg-slate-900/50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Corporate Identity Provider (IdP) Parameters</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-mono">Federation Protocol / Preset</label>
                  <select
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SAML_2_0">Standard SAML 2.0</option>
                    <option value="OKTA">Okta Single Sign-On</option>
                    <option value="ENTRA_ID">Microsoft Entra ID (Azure AD)</option>
                    <option value="GOOGLE_WORKSPACE">Google Workspace SAML</option>
                    <option value="PING_IDENTITY">PingIdentity Federation</option>
                    <option value="OIDC">OpenID Connect (OIDC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-mono">IdP Single Sign-On Endpoint (SSO URL)</label>
                  <input
                    type="text"
                    value={signOnUrl}
                    onChange={(e) => setSignOnUrl(e.target.value)}
                    placeholder="https://login.microsoftonline.com/.../saml2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-mono">IdP Issuer / Entity ID</label>
                  <input
                    type="text"
                    value={issuerUrl}
                    onChange={(e) => setIssuerUrl(e.target.value)}
                    placeholder="https://sts.windows.net/tenant-guid/"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-mono">Client ID (OIDC only)</label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="ravengard-corp-client-id"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-mono">IdP Public X.509 Certificate (PEM Format)</label>
                <textarea
                  value={x509Cert}
                  onChange={(e) => setX509Cert(e.target.value)}
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----\nMIIDdDCCAlygAwIBAgIGAYvK1w9EMA0GCSqGSIb3DQEBCwUAMHUxFDASBgNVBAMTC2Fk..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Allowed Corporate Domains */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-mono">Restricted Corporate Email Domains</label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {allowedDomains.map((dom) => (
                    <span key={dom} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono">
                      <span>@{dom}</span>
                      <button onClick={() => handleRemoveDomain(dom)} className="text-slate-500 hover:text-rose-400">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="partner.corp"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDomain())}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddDomain}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-colors"
                  >
                    Add Domain
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? "Saving Parameters..." : "Save Identity Parameters"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Built-in IdP Sandbox */}
      {activeTab === "sandbox" && (
        <div className="space-y-6">
          <Card className="p-5 border-slate-800 bg-slate-900/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time SAML 2.0 & OIDC Assertion Simulator</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Dry-run authentic assertions against Ravengard SP endpoints to verify signature validation, attribute mapping, and role computation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono mb-4">
              <div>
                <label className="block text-slate-400 mb-1">Simulated Identity Provider</label>
                <select
                  value={sandboxProvider}
                  onChange={(e) => setSandboxProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="OKTA">Okta Cloud IdP</option>
                  <option value="ENTRA_ID">Microsoft Entra ID (Azure AD)</option>
                  <option value="GOOGLE_WORKSPACE">Google Workspace Enterprise</option>
                  <option value="PING_IDENTITY">PingIdentity Single Sign-On</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Simulated User Email</label>
                <input
                  type="email"
                  value={sandboxEmail}
                  onChange={(e) => setSandboxEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Full Name & Groups</label>
                <input
                  type="text"
                  value={sandboxGroups}
                  onChange={(e) => setSandboxGroups(e.target.value)}
                  placeholder="HR_Recruiters, Ravengard_Admins"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <button
              onClick={handleRunSandbox}
              disabled={sandboxRunning}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{sandboxRunning ? "Simulating Cryptographic Handshake..." : "Execute IdP Assertion Test"}</span>
            </button>
          </Card>

          {sandboxResult && (
            <Card className="p-5 border-slate-800 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {sandboxResult.status}
                  </span>
                  <span className="text-slate-300 text-xs font-mono font-medium">{sandboxResult.signatureStatus}</span>
                </div>
                <span className="text-slate-400 text-xs font-mono">Assertion ID: {sandboxResult.assertionId}</span>
              </div>

              {/* Inferred Role Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-1">Computed Ravengard Role</span>
                  <span className="text-emerald-400 font-semibold">{sandboxResult.roleMappingResult.assignedRole.toUpperCase()}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-1">Access Authorization</span>
                  <span className="text-slate-200">{sandboxResult.roleMappingResult.accessTier}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-1">MFA Enforcement Gate</span>
                  <span className="text-cyan-400">PASSED (FIDO2 Required)</span>
                </div>
              </div>

              {/* Raw XML Inspector */}
              <div>
                <span className="text-slate-400 text-xs font-mono block mb-2">Cryptographic SAML 2.0 XML Assertion:</span>
                <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {sandboxResult.rawXml}
                </pre>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: SCIM 2.0 Directory Sync */}
      {activeTab === "scim" && (
        <div className="space-y-6">
          <Card className="p-5 border-slate-800 bg-slate-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>SCIM 2.0 Inbound REST Endpoints</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Point your Okta or Workday SCIM 2.0 connector to automated employee lifecycle hooks.
                </p>
              </div>

              <button
                onClick={handleTriggerSyncNow}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Syncing..." : "Simulate SCIM Batch"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Base SCIM 2.0 URL</span>
                <span className="text-slate-200">https://ravengard.ai/scim/v2</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">User Provisioning Endpoint</span>
                <span className="text-slate-200">POST /scim/v2/Users</span>
              </div>
            </div>
          </Card>

          {/* New Token Banner */}
          {newRawToken && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs font-mono text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>New SCIM Bearer Token Generated</span>
              </div>
              <p className="text-amber-300/80">Copy this token immediately. For security, it cannot be shown again.</p>
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-amber-800/50">
                <span className="text-slate-200 truncate">{newRawToken}</span>
                <button
                  onClick={() => copyToClipboard(newRawToken, setCopiedToken)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Token Generation & List */}
          <Card className="p-5 border-slate-800 bg-slate-900/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-3">
              Active SCIM 2.0 Bearer Credentials
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="Connector Name (e.g. Workday SCIM Connector)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleCreateScimToken}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Token</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
              {tokens.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-mono">
                  No active SCIM tokens. Generate a token to connect Okta or Microsoft Entra ID.
                </div>
              ) : (
                tokens.map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-200 font-medium block">{t.name}</span>
                      <span className="text-slate-500 text-[11px]">
                        Created {new Date(t.createdAt).toLocaleDateString()} · Last used: {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleTimeString() : "Never"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRevokeToken(t.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Revoke Token"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Sync History Logs */}
          <Card className="p-5 border-slate-800 bg-slate-900/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-3">
              Automated Directory Sync Audit Trail
            </h3>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
              {syncLogs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-mono">
                  No directory synchronization cycles logged yet.
                </div>
              ) : (
                syncLogs.slice(0, 8).map((l) => (
                  <div key={l.id} className="p-3 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${l.status === "SUCCESS" ? "bg-emerald-400" : "bg-rose-400"}`} />
                        <span className="text-slate-200">{l.action}</span>
                        <span className="text-slate-500 text-[11px]">({l.provider})</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{l.details}</p>
                    </div>
                    <span className="text-slate-500 text-[11px] shrink-0">
                      {new Date(l.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: MFA & Access Policies */}
      {activeTab === "mfa" && (
        <Card className="p-5 border-slate-800 bg-slate-900/50 space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Multi-Factor Authentication (MFA) & Step-Up Security</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select mandatory hardware MFA policies for administrative and talent acquisition users.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "DISABLED",
                title: "Optional / Password + Email Link",
                desc: "Allowed for dev environments only. Not compliant with SOC 2 or ISO 27001."
              },
              {
                id: "TOTP",
                title: "Time-Based One-Time Password (TOTP)",
                desc: "Google Authenticator, Microsoft Authenticator, or 1Password 6-digit codes required for login."
              },
              {
                id: "WEBAUTHN",
                title: "WebAuthn / FIDO2 Hardware Keys (Recommended)",
                desc: "Mandatory biometric Passkeys or physical YubiKeys. Phishing-resistant standard."
              },
              {
                id: "STRICT_ENFORCEMENT",
                title: "Strict Corporate Enforcement",
                desc: "Hardware WebAuthn mandatory for super_admin and hr_admin. Sessions terminated after 60 min idle."
              }
            ].map((policy) => (
              <label
                key={policy.id}
                className={`p-3.5 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                  mfaPolicy === policy.id
                    ? "bg-indigo-950/30 border-indigo-500 text-slate-100"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="mfaPolicy"
                  value={policy.id}
                  checked={mfaPolicy === policy.id}
                  onChange={(e) => setMfaPolicy(e.target.value)}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-mono text-xs font-semibold block">{policy.title}</span>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{policy.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? "Updating Policy..." : "Enforce MFA Security Policy"}
          </button>
        </Card>
      )}
    </div>
  );
}

export default SsoDirectoryView;
