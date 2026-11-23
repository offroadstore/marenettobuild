CREATE TABLE IF NOT EXISTS ai_visibility_settings (
  environment text PRIMARY KEY, revision text NOT NULL,
  budget_micros bigint NOT NULL DEFAULT 0 CHECK (budget_micros >= 0),
  weekly_enabled boolean NOT NULL DEFAULT false, worker_at timestamptz, last_start_at timestamptz,
  questions jsonb NOT NULL, bing_property text, bing_revision text NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_visibility_campaigns (
  id text PRIMARY KEY, environment text NOT NULL, week_key text, state text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_visibility_week_unique ON ai_visibility_campaigns(environment, week_key) WHERE week_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_visibility_campaign_env ON ai_visibility_campaigns(environment,at);
CREATE TABLE IF NOT EXISTS ai_visibility_jobs (
  id text PRIMARY KEY, campaign_id text NOT NULL REFERENCES ai_visibility_campaigns(id),
  environment text NOT NULL, question jsonb NOT NULL, provider text NOT NULL,
  model text NOT NULL, method text NOT NULL, state text NOT NULL,
  month text, reserved_micros bigint NOT NULL DEFAULT 0, charged_micros bigint,
  claimed_at timestamptz, at timestamptz NOT NULL DEFAULT now(),
  result jsonb, checkpoint integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ai_visibility_job_env ON ai_visibility_jobs(environment,at);
CREATE INDEX IF NOT EXISTS ai_visibility_job_campaign ON ai_visibility_jobs(campaign_id,state);
