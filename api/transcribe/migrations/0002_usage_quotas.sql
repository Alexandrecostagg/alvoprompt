CREATE TABLE IF NOT EXISTS usage_monthly (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  ai_actions INTEGER NOT NULL DEFAULT 0 CHECK (ai_actions >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, month)
);
