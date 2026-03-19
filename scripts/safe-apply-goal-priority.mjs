import { config } from "dotenv";
import { createClient } from "@libsql/client";

config({ path: ".env.local" });

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function columnExists(client, table, column) {
  const res = await client.execute({ sql: `PRAGMA table_info(${table})` });
  return res.rows.some((r) => String(r.name) === column);
}

async function exec(client, sql) {
  await client.execute(sql);
}

async function safeAddColumn(client, table, column, ddl) {
  if (await columnExists(client, table, column)) return { table, column, action: "skip" };
  try {
    await exec(client, ddl);
    return { table, column, action: "added" };
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.toLowerCase().includes("duplicate column name")) return { table, column, action: "skip" };
    throw e;
  }
}

async function main() {
  const url = mustEnv("TURSO_DATABASE_URL");
  const authToken = mustEnv("TURSO_AUTH_TOKEN");
  const client = createClient({ url, authToken });

  const results = [];

  // goals: AI priority matrix columns
  results.push(await safeAddColumn(client, "goals", "priority_quadrant", `ALTER TABLE goals ADD COLUMN priority_quadrant text;`));
  results.push(await safeAddColumn(client, "goals", "priority_reason", `ALTER TABLE goals ADD COLUMN priority_reason text;`));
  results.push(await safeAddColumn(client, "goals", "priority_updated_at", `ALTER TABLE goals ADD COLUMN priority_updated_at integer;`));

  for (const r of results) console.log(`${r.action}: ${r.table}.${r.column}`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

