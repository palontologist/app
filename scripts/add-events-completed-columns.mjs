/**
 * Add completed and completed_at columns to events table.
 * Run: node scripts/add-events-completed-columns.mjs
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
    await client.execute("ALTER TABLE events ADD COLUMN completed integer DEFAULT 0");
    console.log("✓ Added column: completed");
  } catch (e) {
    const msg = (e.cause?.message ?? e.message ?? "").toLowerCase();
    if (msg.includes("duplicate column")) console.log("  Column completed already exists");
    else throw e;
  }
  try {
    await client.execute("ALTER TABLE events ADD COLUMN completed_at integer");
    console.log("✓ Added column: completed_at");
  } catch (e) {
    const msg = (e.cause?.message ?? e.message ?? "").toLowerCase();
    if (msg.includes("duplicate column")) console.log("  Column completed_at already exists");
    else throw e;
  }
  console.log("✓ events table ready for completion tracking");
  client.close();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
