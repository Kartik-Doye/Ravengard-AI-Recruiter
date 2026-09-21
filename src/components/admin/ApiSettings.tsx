import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Layers,
  Webhook,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

interface AtsProviderConfig {
  provider: 'greenhouse' | 'lever' | 'workday';
  isEnabled: boolean;
  apiEndpoint: string;
  webhookUrl: string;
  isConfigured: boolean;
}

export function ApiSettings() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [providers, setProviders] = useState<AtsProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New key creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'candidates:read',
    'candidates:write',
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedKeyResult, setGeneratedKeyResult] = useState<{
    key: string;
    name: string;
    keyPrefix: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // ATS Provider Edit State
  const [editingProvider, setEditingProvider] = useState<'greenhouse' | 'lever' | 'workday' | null>(null);
  const [providerSecret, setProviderSecret] = useState('');
  const [providerEndpoint, setProviderEndpoint] = useState('');
  const [providerEnabled, setProviderEnabled] = useState(true);
  const [savingProvider, setSavingProvider] = useState(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('ravengard_admin_token') || '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [keysRes, providersRes] = await Promise.all([
        fetch('/api/hr/settings/api-keys', { headers: getAuthHeaders() }),
        fetch('/api/hr/settings/integrations', { headers: getAuthHeaders() }),
      ]);

      if (!keysRes.ok || !providersRes.ok) {
        throw new Error('Failed to load integration settings');
      }

      const keysData = await keysRes.json();
      const providersData = await providersRes.json();

      setKeys(keysData.keys || []);
      setProviders(providersData.providers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/hr/settings/api-keys', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: selectedScopes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');

      setGeneratedKeyResult({
        key: data.key,
        name: data.name,
        keyPrefix: data.keyPrefix,
      });
      setNewKeyName('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently revoke key "${name}"? External systems using it will be instantly disconnected.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/hr/settings/api-keys/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to revoke key');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveProvider = async (provider: 'greenhouse' | 'lever' | 'workday') => {
    setSavingProvider(true);
    try {
      const res = await fetch('/api/hr/settings/integrations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          provider,
          webhookSecret: providerSecret,
          apiEndpoint: providerEndpoint,
          isEnabled: providerEnabled,
        }),
      });
      if (!res.ok) throw new Error('Failed to save integration settings');

      setEditingProvider(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingProvider(false);
    }
  };

  const handleSendTestWebhook = async (provider: 'greenhouse' | 'lever' | 'workday') => {
    setTestWebhookStatus(`Dispatching test ping to ${provider}...`);
    try {
      const res = await fetch(`/api/v1/integrations/webhooks/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ravengard-Sandbox': 'true',
          'X-Organization-Id': 'org-ravengard',
        },
        body: JSON.stringify({
          action: 'ping',
          event: 'ping',
          timestamp: new Date().toISOString(),
          test: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestWebhookStatus(`✓ ${provider} test verified successfully: ${data.message || '200 OK'}`);
      } else {
        setTestWebhookStatus(`✕ ${provider} test failed: ${data.error || res.statusText}`);
      }
    } catch (err: any) {
      setTestWebhookStatus(`✕ Webhook test error: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-display font-medium text-white tracking-wide">
              API Keys & ATS Integrations
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              TENANT ISOLATED
            </span>
          </div>
          <p className="text-xs text-white/50">
            Generate scoped enterprise tokens (<code className="font-mono text-white/70">rg_live_</code>) and manage webhook pipelines for Greenhouse, Lever, and Workday.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setGeneratedKeyResult(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90 text-black text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto underline hover:text-white">Retry</button>
        </div>
      )}

      {/* SECTION 1: Tenant API Keys */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[var(--color-secondary)]" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-white/90">
              Active API Credentials
            </h2>
          </div>
          <span className="text-xs font-mono text-white/40">
            {keys.length} key{keys.length === 1 ? '' : 's'} provisioned
          </span>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-white/40">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 opacity-50" />
              Loading security credentials...
            </div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/40">
              No API keys generated yet. Create one to enable external candidate ingestion and outbound sync.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/5 border-b border-white/10 text-white/50 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Key Prefix</th>
                    <th className="py-3 px-4">Scopes</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4">Last Used</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-sans font-medium text-white">
                        {k.name}
                      </td>
                      <td className="py-3.5 px-4 text-white/60">
                        <code>{k.keyPrefix}••••••••</code>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/70 border border-white/10"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-white/40">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-white/40">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Revoke this API key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: ATS Integration Pipelines */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-white/90">
              ATS Pipelines (Greenhouse, Lever, Workday)
            </h2>
          </div>
          {testWebhookStatus && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {testWebhookStatus}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['greenhouse', 'lever', 'workday'] as const).map((providerKey) => {
            const config = providers.find((p) => p.provider === providerKey);
            const isEditing = editingProvider === providerKey;

            return (
              <div
                key={providerKey}
                className="p-5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-display font-medium text-white text-base">
                        {providerKey}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                        config?.isEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      {config?.isEnabled ? 'ENABLED' : 'NOT CONFIGURED'}
                    </span>
                  </div>

                  <p className="text-xs text-white/50 mb-3 leading-relaxed">
                    {providerKey === 'greenhouse' && 'Inbound stage transitions & job applications with HMAC-SHA256 signature.'}
                    {providerKey === 'lever' && 'Webhook triggers for candidateStageChange and interview invitations.'}
                    {providerKey === 'workday' && 'Enterprise candidate sync and requisition mapping.'}
                  </p>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="text-[11px] text-white/40">Webhook Endpoint:</div>
                    <div className="p-2 rounded bg-black/40 border border-white/5 text-white/70 break-all flex items-center justify-between gap-2">
                      <span>/api/v1/integrations/webhooks/{providerKey}</span>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/api/v1/integrations/webhooks/${providerKey}`)}
                        className="text-white/40 hover:text-white transition-colors"
                        title="Copy absolute URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSendTestWebhook(providerKey)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono transition-colors"
                    title="Send simulated test ping"
                  >
                    <Send className="w-3 h-3" />
                    <span>Test Ping</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProvider(providerKey);
                      setProviderEndpoint(config?.apiEndpoint || '');
                      setProviderEnabled(config?.isEnabled ?? true);
                      setProviderSecret('');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] text-xs font-mono transition-colors"
                  >
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F17] border border-white/10 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            {generatedKeyResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-display font-medium text-white text-base">
                    API Key Created
                  </h3>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
                  <strong>Save this secret key immediately.</strong> For enterprise security, we store only a cryptographic SHA-256 hash. You will never be able to view this full key again.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-white/50">Your Live API Secret:</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-xs text-white select-all break-all">
                    <span>{generatedKeyResult.key}</span>
                    <button
                      onClick={() => copyToClipboard(generatedKeyResult.key)}
                      className="ml-auto p-1.5 rounded bg-white/10 hover:bg-white/20 text-white shrink-0"
                      title="Copy Key"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                >
                  I Have Saved My Secret Key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-medium text-white text-base">
                    Generate New Live API Key
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-white/40 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/70">Key Name</label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Greenhouse Production Ingestion"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-[var(--color-secondary)]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-white/70">Scopes</label>
                  <div className="space-y-1.5 text-xs font-mono">
                    {[
                      { id: 'candidates:read', label: 'candidates:read (Query candidate evaluations & reports)' },
                      { id: 'candidates:write', label: 'candidates:write (Ingest & trigger screening)' },
                      { id: 'assessments:export', label: 'assessments:export (Trigger outbound scorecard sync)' },
                    ].map((scope) => (
                      <label key={scope.id} className="flex items-center gap-2 text-white/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedScopes([...selectedScopes, scope.id]);
                            } else {
                              setSelectedScopes(selectedScopes.filter((s) => s !== scope.id));
                            }
                          }}
                          className="rounded border-white/20 bg-white/5 text-[var(--color-secondary)]"
                        />
                        <span>{scope.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newKeyName.trim()}
                    className="px-4 py-2 rounded-lg bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90 text-black text-xs font-semibold disabled:opacity-50"
                  >
                    {isCreating ? 'Generating...' : 'Create Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CONFIGURE PROVIDER MODAL */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F17] border border-white/10 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium text-white text-base capitalize">
                Configure {editingProvider} Pipeline
              </h3>
              <button
                type="button"
                onClick={() => setEditingProvider(null)}
                className="text-white/40 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-white/70 block mb-1">Webhook Secret (HMAC-SHA256)</label>
                <input
                  type="password"
                  value={providerSecret}
                  onChange={(e) => setProviderSecret(e.target.value)}
                  placeholder="Enter webhook secret or leave empty to keep existing"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-[var(--color-secondary)] font-mono"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Used to verify cryptographic payload integrity on incoming events.
                </p>
              </div>

              <div>
                <label className="text-white/70 block mb-1">Outbound Sync Endpoint (Optional)</label>
                <input
                  type="url"
                  value={providerEndpoint}
                  onChange={(e) => setProviderEndpoint(e.target.value)}
                  placeholder="https://harvest.greenhouse.io/v1/..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-[var(--color-secondary)] font-mono"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Target API endpoint where Ravengard's Outbox will push scorecards and dossier links.
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-white/80">
                  <input
                    type="checkbox"
                    checked={providerEnabled}
                    onChange={(e) => setProviderEnabled(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-[var(--color-secondary)]"
                  />
                  <span>Enable webhook ingestion for this provider</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProvider(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingProvider}
                onClick={() => handleSaveProvider(editingProvider)}
                className="px-4 py-2 rounded-lg bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90 text-black text-xs font-semibold disabled:opacity-50"
              >
                {savingProvider ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
