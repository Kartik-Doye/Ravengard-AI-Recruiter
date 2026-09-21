-- 1. Client API Keys for External ATS Access
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  scopes JSONB NOT NULL DEFAULT '["candidates:read", "candidates:write"]'::jsonb,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org_hash ON api_keys(organization_id, key_hash) WHERE revoked_at IS NULL;

-- 2. Tenant Integration Credentials & Webhook Secrets
CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  provider VARCHAR(32) NOT NULL, -- 'greenhouse', 'lever', 'workday'
  api_endpoint VARCHAR(512),
  encrypted_credentials JSONB NOT NULL, -- AES-256-GCM encrypted tokens/API keys
  webhook_secret VARCHAR(255),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, provider)
);

-- 3. Outbox Events for Asynchronous Export Sync
CREATE TABLE IF NOT EXISTS outbox_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  event_type VARCHAR(64) NOT NULL, -- 'ATS_EXPORT_CANDIDATE_SCORECARD'
  payload JSONB NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_processing ON outbox_events(status, next_retry_at) WHERE status IN ('pending', 'failed');
