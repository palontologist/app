import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';

// Use local SQLite database for development
let _db: ReturnType<typeof drizzle> | null = null

function initDb() {
  if (_db) return _db

  const sqlite = new Database('./database.db');
  _db = drizzle(sqlite, { schema })
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
