-- SQLite migration for value tracking tables
-- Clients/projects tracking
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  hourly_rate REAL,
  target_rate REAL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Granular time tracking (supplements work_sessions)
CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  client_id INTEGER,
  date INTEGER NOT NULL,
  hours REAL NOT NULL DEFAULT 0,
  description TEXT,
  activity_type TEXT,
  invoiced INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Payment/revenue tracking
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  client_id INTEGER,
  amount REAL NOT NULL,
  date INTEGER NOT NULL,
  type TEXT,
  invoice_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Equity tracking
CREATE TABLE IF NOT EXISTS equity_bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  estimated_value REAL,
  time_invested REAL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  client_id INTEGER,
  description TEXT,
  hours REAL,
  rate REAL,
  amount REAL,
  invoice_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Revenue impact tracking
CREATE TABLE IF NOT EXISTS revenue_impact (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  activity_type TEXT,
  amount REAL,
  time_invested REAL,
  date INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Extend events table with value tracking fields
ALTER TABLE events ADD COLUMN client_id INTEGER;
ALTER TABLE events ADD COLUMN project_tag TEXT;
ALTER TABLE events ADD COLUMN founder_bet_category TEXT;
ALTER TABLE events ADD COLUMN estimated_hours REAL;
ALTER TABLE events ADD COLUMN tagged_status TEXT DEFAULT 'pending';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_client_id ON time_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_equity_bets_user_id ON equity_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_impact_user_id ON revenue_impact(user_id);
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);
