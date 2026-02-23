/**
 * Migration script to add value tracking tables for Greta dashboard
 * Run: node scripts/add-value-tracking-tables.mjs
 */
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  try {
    // Clients/projects tracking
    await client.execute(`CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  hourly_rate REAL,
  target_rate REAL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`);
    console.log("✓ clients table created");

    // Granular time tracking
    await client.execute(`CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  client_id INTEGER,
  date INTEGER NOT NULL,
  hours REAL NOT NULL DEFAULT 0,
  description TEXT,
  activity_type TEXT,
  invoiced INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`);
    console.log("✓ time_entries table created");

    // Payment/revenue tracking
    await client.execute(`CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  client_id INTEGER,
  amount REAL NOT NULL,
  date INTEGER NOT NULL,
  type TEXT,
  invoice_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`);
    console.log("✓ payments table created");

    // Equity tracking
    await client.execute(`CREATE TABLE IF NOT EXISTS equity_bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  estimated_value REAL,
  time_invested REAL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`);
    console.log("✓ equity_bets table created");

    // Invoice line items
    await client.execute(`CREATE TABLE IF NOT EXISTS invoice_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  client_id INTEGER,
  description TEXT,
  hours REAL,
  rate REAL,
  amount REAL,
  invoice_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`);
    console.log("✓ invoice_line_items table created");

    // Revenue impact tracking
    await client.execute(`CREATE TABLE IF NOT EXISTS revenue_impact (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  activity_type TEXT,
  amount REAL,
  time_invested REAL,
  date INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`);
    console.log("✓ revenue_impact table created");

    // Add columns to events table for value tracking
    try {
      await client.execute("ALTER TABLE events ADD COLUMN client_id INTEGER");
      console.log("✓ events.client_id column added");
    } catch (e) {
      if (e.message.includes("duplicate column")) {
        console.log("⊘ events.client_id column already exists");
      } else {
        throw e;
      }
    }

    try {
      await client.execute("ALTER TABLE events ADD COLUMN project_tag TEXT");
      console.log("✓ events.project_tag column added");
    } catch (e) {
      if (e.message.includes("duplicate column")) {
        console.log("⊘ events.project_tag column already exists");
      } else {
        throw e;
      }
    }

    try {
      await client.execute("ALTER TABLE events ADD COLUMN founder_bet_category TEXT");
      console.log("✓ events.founder_bet_category column added");
    } catch (e) {
      if (e.message.includes("duplicate column")) {
        console.log("⊘ events.founder_bet_category column already exists");
      } else {
        throw e;
      }
    }

    try {
      await client.execute("ALTER TABLE events ADD COLUMN estimated_hours REAL");
      console.log("✓ events.estimated_hours column added");
    } catch (e) {
      if (e.message.includes("duplicate column")) {
        console.log("⊘ events.estimated_hours column already exists");
      } else {
        throw e;
      }
    }

    try {
      await client.execute("ALTER TABLE events ADD COLUMN tagged_status TEXT DEFAULT 'pending'");
      console.log("✓ events.tagged_status column added");
    } catch (e) {
      if (e.message.includes("duplicate column")) {
        console.log("⊘ events.tagged_status column already exists");
      } else {
        throw e;
      }
    }

    // Create indexes for performance
    await client.execute("CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_time_entries_client_id ON time_entries(client_id)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_equity_bets_user_id ON equity_bets(user_id)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_revenue_impact_user_id ON revenue_impact(user_id)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id)");
    console.log("✓ All indexes created");

    console.log("\n✅ Value tracking migration completed successfully!");
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
