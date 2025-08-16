import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';

// Lazily initialize the libsql client and drizzle instance so that import-time
// (build-time) execution doesn't immediately pass `undefined` into the
// underlying client when environment variables are not provided.
let _client: ReturnType<typeof createClient> | null = null
let _db: ReturnType<typeof drizzle> | null = null

function initDb() {
  if (_db) return _db

  const url = process.env.TURSO_DATABASE_URL
  if (!url) {
    // Throw a helpful error that explains what's missing. This will still
    // surface in logs, but it's clearer than the lower-level libsql URL
    // validation error.
    throw new Error(
      'TURSO_DATABASE_URL environment variable is not set. Please set TURSO_DATABASE_URL to your libsql/Turso connection URL.'
    )
  }

  _client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  _db = drizzle(_client, { schema })
  return _db
}

// Export a proxy that will initialize the DB on first access. This keeps the
// public API the same (modules can still import `db` and call methods like
// `db.select()`), but avoids creating the client at module import time.
export const db: any = new Proxy(
  {},
  {
    get(_target, prop: string | symbol) {
      const real = initDb()
      // @ts-ignore - delegate to the real drizzle instance
      return (real as any)[prop]
    },
    // support calling the db if code attempts function-like usage
    apply(_target, thisArg, args) {
      const real = initDb()
      return (real as any).apply(thisArg, args)
    },
  }
)

export * from '@/db/schema'
