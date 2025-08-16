// Ensure we load variables from .env.local (Next.js dev) OR fallback to .env
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback if some vars only in .env

import type { Config } from "drizzle-kit";

if (!process.env.TURSO_DATABASE_URL) {
  console.warn("[drizzle-config] TURSO_DATABASE_URL not set. Ensure it's in .env.local or .env before running migrations.");
}

export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;