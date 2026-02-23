/**
 * Add Google Calendar columns to events table.
 * Run: node scripts/add-events-calendar-columns.mjs
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
    await client.execute("ALTER TABLE events ADD COLUMN source TEXT DEFAULT 'local'");
    console.log("✓ Added column: source");
  } catch (e) {
    const msg = (e.cause?.message ?? e.message ?? "").toLowerCase();
    if (msg.includes("duplicate column") || msg.includes("duplicate column name")) {
      console.log("  Column source already exists");
    } else throw e;
  }

  try {
    await client.execute("ALTER TABLE events ADD COLUMN google_event_id TEXT");
    console.log("✓ Added column: google_event_id");
  } catch (e) {
    const msg = (e.cause?.message ?? e.message ?? "").toLowerCase();
    if (msg.includes("duplicate column") || msg.includes("duplicate column name")) {
      console.log("  Column google_event_id already exists");
    } else throw e;
  }

  try {
    await client.execute("ALTER TABLE events ADD COLUMN google_calendar_id TEXT");
    console.log("✓ Added column: google_calendar_id");
  } catch (e) {
    const msg = (e.cause?.message ?? e.message ?? "").toLowerCase();
    if (msg.includes("duplicate column") || msg.includes("duplicate column name")) {
      console.log("  Column google_calendar_id already exists");
    } else throw e;
  }

  try {
    await client.execute("CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_events_source_user ON events(source, user_id)");
    console.log("✓ Created indexes");
  } catch (e) {
    console.error("Index creation:", e.message);
  }

  console.log("✓ events table ready for Google Calendar sync");
  client.close();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
