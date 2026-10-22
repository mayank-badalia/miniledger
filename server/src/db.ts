// Database setup.
// We use the "pg" library directly with plain SQL (no ORM) so that
// every query in this project is something you can read and explain.

import { Pool, types } from "pg";
import { SCHEMA_SQL } from "./schema";

// By default pg turns a DATE column into a JS Date at local midnight, which
// can shift the day when converted to UTC JSON (e.g. the 10th shows as the
// 9th). We ask pg to leave DATE values as plain "YYYY-MM-DD" strings instead.
// (1082 is Postgres's internal id for the DATE type.)
types.setTypeParser(1082, (value) => value);

const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ?? // the name Vercel's Postgres integration injects
  "postgres://miniledger:miniledger@localhost:5434/miniledger";

// Hosted Postgres (Neon, and most cloud providers) require TLS. Local Docker
// does not. We turn SSL on when the connection string asks for it, or when
// we're running on Vercel.
const needsSsl =
  !!process.env.VERCEL ||
  /sslmode=require/.test(connectionString) ||
  /\.neon\.tech/.test(connectionString);

// A connection "pool" keeps a few Postgres connections open and reuses them.
export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

// Small helper so routes can write `db.query(sql, params)`.
export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
};

// Create the tables if they don't exist. We cache the promise so that on a
// serverless platform the schema runs at most once per warm instance, no
// matter how many requests come in.
let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool.query(SCHEMA_SQL).then(() => {
      console.log("[db] schema ready");
    });
  }
  return schemaReady;
}

// Kept for the local server entry point (reads nicely as "set up the DB").
export const initDb = ensureSchema;
