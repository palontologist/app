import { config } from "dotenv";
import { createClient } from "@libsql/client";

config({ path: ".env.local" });

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function tableExists(client, name) {
  const res = await client.execute({
    sql: "SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
    args: [name],
  });
  return res.rows.length > 0;
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
    // If column already exists due to race/manual change, ignore.
    const msg = String(e?.message || e);
    if (msg.toLowerCase().includes("duplicate column name")) return { table, column, action: "skip" };
    throw e;
  }
}

async function main() {
  const url = mustEnv("TURSO_DATABASE_URL");
  const authToken = mustEnv("TURSO_AUTH_TOKEN");
  const client = createClient({ url, authToken });

  // 1) Create social/opportunity tables if missing
  if (!(await tableExists(client, "user_follows"))) {
    await exec(
      client,
      `CREATE TABLE user_follows (
        follower_id text NOT NULL,
        following_id text NOT NULL,
        created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
      );`
    );
    await exec(
      client,
      `CREATE UNIQUE INDEX user_follows_follower_following_unique ON user_follows (follower_id, following_id);`
    );
    console.log("Created table: user_follows");
  } else {
    console.log("Table exists: user_follows");
  }

  if (!(await tableExists(client, "opportunities"))) {
    await exec(
      client,
      `CREATE TABLE opportunities (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        type text NOT NULL,
        title text NOT NULL,
        description text,
        url text,
        geohash5 text,
        active integer DEFAULT true,
        created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
      );`
    );
    console.log("Created table: opportunities");
  } else {
    console.log("Table exists: opportunities");
  }

  if (!(await tableExists(client, "opportunity_unlock_rules"))) {
    await exec(
      client,
      `CREATE TABLE opportunity_unlock_rules (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        opportunity_id integer NOT NULL,
        metric text NOT NULL,
        threshold integer NOT NULL,
        window_days integer,
        goal_category text,
        activity_title text,
        created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
      );`
    );
    console.log("Created table: opportunity_unlock_rules");
  } else {
    console.log("Table exists: opportunity_unlock_rules");
  }

  if (!(await tableExists(client, "user_opportunity_unlocks"))) {
    await exec(
      client,
      `CREATE TABLE user_opportunity_unlocks (
        user_id text NOT NULL,
        opportunity_id integer NOT NULL,
        unlocked_at integer DEFAULT (unixepoch() * 1000) NOT NULL
      );`
    );
    await exec(
      client,
      `CREATE UNIQUE INDEX user_opportunity_unlocks_user_opportunity_unique ON user_opportunity_unlocks (user_id, opportunity_id);`
    );
    console.log("Created table: user_opportunity_unlocks");
  } else {
    console.log("Table exists: user_opportunity_unlocks");
  }

  // 2) Add columns needed for social/nearby feed (best-effort, only if missing)
  if (await tableExists(client, "user_profiles")) {
    const profileAdds = [
      ["handle", `ALTER TABLE user_profiles ADD COLUMN handle text;`],
      ["bio", `ALTER TABLE user_profiles ADD COLUMN bio text;`],
      ["discoverable", `ALTER TABLE user_profiles ADD COLUMN discoverable integer DEFAULT true;`],
      ["location_sharing_enabled", `ALTER TABLE user_profiles ADD COLUMN location_sharing_enabled integer DEFAULT false;`],
      ["location_geohash5", `ALTER TABLE user_profiles ADD COLUMN location_geohash5 text;`],
      ["location_updated_at", `ALTER TABLE user_profiles ADD COLUMN location_updated_at integer;`],
    ];
    for (const [col, ddl] of profileAdds) {
      const r = await safeAddColumn(client, "user_profiles", col, ddl);
      if (r.action === "added") console.log(`Added column user_profiles.${col}`);
    }
    // Create unique index for handle if not present
    try {
      await exec(client, `CREATE UNIQUE INDEX user_profiles_handle_unique ON user_profiles (handle);`);
      console.log("Created index: user_profiles_handle_unique");
    } catch (e) {
      const msg = String(e?.message || e).toLowerCase();
      if (msg.includes("already exists")) {
        console.log("Index exists: user_profiles_handle_unique");
      } else {
        throw e;
      }
    }
  }

  if (await tableExists(client, "goal_activities")) {
    const activityAdds = [
      ["completed_at", `ALTER TABLE goal_activities ADD COLUMN completed_at integer;`],
      ["visibility", `ALTER TABLE goal_activities ADD COLUMN visibility text DEFAULT 'followers';`],
      ["completed_geohash5", `ALTER TABLE goal_activities ADD COLUMN completed_geohash5 text;`],
    ];
    for (const [col, ddl] of activityAdds) {
      const r = await safeAddColumn(client, "goal_activities", col, ddl);
      if (r.action === "added") console.log(`Added column goal_activities.${col}`);
    }
  }

  if (await tableExists(client, "goals")) {
    const goalAdds = [
      ["alignment_score", `ALTER TABLE goals ADD COLUMN alignment_score integer;`],
      ["alignment_category", `ALTER TABLE goals ADD COLUMN alignment_category text;`],
      ["mission_pillar", `ALTER TABLE goals ADD COLUMN mission_pillar text;`],
      ["impact_statement", `ALTER TABLE goals ADD COLUMN impact_statement text;`],
      ["ai_suggestions", `ALTER TABLE goals ADD COLUMN ai_suggestions text;`],
    ];
    for (const [col, ddl] of goalAdds) {
      const r = await safeAddColumn(client, "goals", col, ddl);
      if (r.action === "added") console.log(`Added column goals.${col}`);
    }
  }

  console.log("Safe apply complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

