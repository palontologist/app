import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.local") });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sql = readFileSync(join(__dirname, "../migrations/0007_value_settings.sql"), "utf-8");

const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const statement of statements) {
  try {
    await client.execute(statement);
    console.log("✓", statement.split("\n")[0].slice(0, 60));
  } catch (err) {
    if (err.message?.includes("duplicate column") || err.message?.includes("already exists")) {
      console.log("⟳ already exists:", statement.split("\n")[0].slice(0, 60));
    } else {
      console.error("✗", statement.split("\n")[0].slice(0, 60));
      console.error("  Error:", err.message);
    }
  }
}

console.log("\nDone.");
process.exit(0);
