/**
 * One-off script to create the google_accounts table in Turso.
 * Run: node scripts/create-google-accounts.mjs
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
    await client.execute(`CREATE TABLE IF NOT EXISTS google_accounts (
  user_id text PRIMARY KEY NOT NULL,
  google_user_id text NOT NULL,
  email text,
  access_token text,
  refresh_token text NOT NULL,
  expiry_date integer,
  scope text,
  token_type text,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL
)`);
    await client.execute(
      "CREATE UNIQUE INDEX IF NOT EXISTS google_accounts_google_user_id_unique ON google_accounts (google_user_id)"
    );
    console.log("✓ google_accounts table created successfully");
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
