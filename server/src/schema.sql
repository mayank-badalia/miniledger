-- MiniLedger database schema.
-- This runs automatically when the API starts (see db.ts -> initDb).
-- "IF NOT EXISTS" means running it twice is harmless.

-- One row per person who logs in. We identify people by phone number.
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  phone       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per loan you have given to a friend.
CREATE TABLE IF NOT EXISTS loans (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_name   TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date      DATE NOT NULL,
  repaid        BOOLEAN NOT NULL DEFAULT FALSE,
  repaid_at     TIMESTAMPTZ,                 -- set when the loan is marked repaid
  receipt_path  TEXT,                        -- optional uploaded receipt photo
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loans are always looked up per user, so index that column.
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
