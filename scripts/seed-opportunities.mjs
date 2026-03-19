import { config } from "dotenv";
import { createClient } from "@libsql/client";

config({ path: ".env.local" });

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  // Avoid duplicating on multiple runs by checking title.
  const existing = await client.execute({ sql: "SELECT title FROM opportunities" });
  const existingTitles = new Set(existing.rows.map((o) => String(o.title)));

  const defs = [
    {
      type: "group",
      title: "Local Accountability Circle",
      description:
        "Small, curated group of 4–6 people with similar goals who meet weekly to share progress and unblock each other.",
      url: null,
      rules: [
        {
          metric: "activity_completions",
          threshold: 7,
          windowDays: 14,
          goalCategory: null,
          activityTitle: null,
        },
      ],
    },
    {
      type: "job",
      title: "Warm Startup Job Leads",
      description:
        "Access a short list of curated early-stage roles plus warm intro templates you can use immediately.",
      url: null,
      rules: [
        {
          metric: "goal_completions",
          threshold: 3,
          windowDays: null,
          goalCategory: "career",
          activityTitle: null,
        },
      ],
    },
    {
      type: "community",
      title: "Founders Focus Community (Invite-only)",
      description:
        "Private community of founders who are actively tracking and improving their alignment between time and mission.",
      url: null,
      rules: [
        {
          metric: "streak_days",
          threshold: 10,
          windowDays: 30,
          goalCategory: null,
          activityTitle: null,
        },
      ],
    },
  ];

  for (const def of defs) {
    if (existingTitles.has(def.title)) {
      console.log(`Skipping existing opportunity: ${def.title}`);
      continue;
    }

    await client.execute({
      sql: `INSERT INTO opportunities (type, title, description, url, geohash5, active, created_at)
            VALUES (?, ?, ?, ?, NULL, 1, (unixepoch() * 1000))`,
      args: [def.type, def.title, def.description, def.url],
    });

    const oppRow = await client.execute({
      sql: "SELECT id FROM opportunities WHERE title = ? LIMIT 1",
      args: [def.title],
    });
    const oppId = Number(oppRow.rows[0]?.id);
    if (!oppId) throw new Error(`Failed to read inserted opportunity id for ${def.title}`);

    for (const r of def.rules) {
      await client.execute({
        sql: `INSERT INTO opportunity_unlock_rules
              (opportunity_id, metric, threshold, window_days, goal_category, activity_title, created_at)
              VALUES (?, ?, ?, ?, ?, ?, (unixepoch() * 1000))`,
        args: [
          oppId,
          r.metric,
          r.threshold,
          r.windowDays,
          r.goalCategory,
          r.activityTitle,
        ],
      });
    }

    console.log(`Seeded opportunity: ${def.title}`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

