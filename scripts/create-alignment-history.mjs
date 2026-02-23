/**
 * Create alignment_history table in Turso.
 * Run: node scripts/create-alignment-history.mjs
 */
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  try {
    await client.execute(`CREATE TABLE IF NOT EXISTS alignment_history (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text NOT NULL,
  date text NOT NULL,
  overall_alignment_score integer NOT NULL,
  completed_tasks_count integer DEFAULT 0,
  total_tasks_count integer DEFAULT 0,
  high_alignment_tasks integer DEFAULT 0,
  distraction_tasks integer DEFAULT 0,
  completed_goals_count integer DEFAULT 0,
  total_goals_count integer DEFAULT 0,
  ai_insights_summary text,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
)`);
    console.log("✓ alignment_history table created successfully");
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
