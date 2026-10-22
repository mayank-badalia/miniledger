// Database setup.
// We use the "pg" library directly with plain SQL (no ORM) so that
// every query in this project is something you can read and explain.

import { Pool, types } from "pg";
import fs from "fs";
import path from "path";

// By default pg turns a DATE column into a JS Date at local midnight, which
// can shift the day when converted to UTC JSON (e.g. the 10th shows as the
// 9th). We ask pg to leave DATE values as plain "YYYY-MM-DD" strings instead.
// (1082 is Postgres's internal id for the DATE type.)
types.setTypeParser(1082, (value) => value);

// A connection "pool" keeps a few Postgres connections open and reuses
// them. We create ONE pool for the whole app and import it everywhere.
export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://miniledger:miniledger@localhost:5434/miniledger",
});

// Small helper so routes can write `db.query(sql, params)`.
export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
};

// Run schema.sql once on startup to make sure our tables exist.
export async function initDb(): Promise<void> {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(sql);
  console.log("[db] schema ready");
}
