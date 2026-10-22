// The database schema as a plain string.
// We keep it in a .ts file (not a .sql file we read from disk) so it gets
// bundled correctly when the API runs as a Vercel serverless function —
// serverless bundles don't reliably include loose .sql files.
//
// Every statement is written to be safe to run repeatedly (IF NOT EXISTS),
// so startup can just run the whole thing each time.

export const SCHEMA_SQL = `
-- People who log in, identified by phone number.
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  phone       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Login codes (OTPs). Stored in the DB so they survive across serverless
-- invocations (an in-memory code could be written by one instance and read
-- by another). One current code per phone.
CREATE TABLE IF NOT EXISTS otps (
  phone       TEXT PRIMARY KEY,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL
);

-- One row per loan you have given to a friend.
CREATE TABLE IF NOT EXISTS loans (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_name   TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date      DATE NOT NULL,
  repaid        BOOLEAN NOT NULL DEFAULT FALSE,
  repaid_at     TIMESTAMPTZ,
  receipt_mime  TEXT,                        -- e.g. "image/jpeg" (if a receipt was added)
  receipt_data  BYTEA,                       -- the raw image bytes
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loans are always looked up per user.
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);

-- Upgrade an older local database (which stored receipts on disk) in place.
ALTER TABLE loans ADD COLUMN IF NOT EXISTS receipt_mime TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS receipt_data BYTEA;
`;
