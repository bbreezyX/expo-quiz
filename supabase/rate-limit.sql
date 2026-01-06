-- Create a table for rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  reset_at BIGINT NOT NULL
);

-- Policy? No need if accessed via service_role in API/Middleware only.
-- But if we want to be safe, enable RLS and allow nothing for anon.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Index for cleanup (optional but good)
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);

-- Function to clean expired rate limits (can be called periodically or by cron)
CREATE OR REPLACE FUNCTION clean_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE reset_at < extract(epoch from now()) * 1000;
END;
$$ LANGUAGE plpgsql;
