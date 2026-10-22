// Login helpers: the (mock) OTP functions and the JWT (login token) functions.

import jwt from "jsonwebtoken";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-super-secret-change-me";
const OTP_TTL_MINUTES = 5; // codes last 5 minutes

// ---- Mock OTP ----------------------------------------------------------
// In a real app an SMS provider would text the code. Here we PRINT IT TO
// THE SERVER LOG, as the brief asked, and store it in the database so it
// works even on serverless (where each request may hit a fresh instance,
// so an in-memory code wouldn't be found again).

// Create a 6-digit code, save it for this phone, log it, and return it.
export async function createOtp(phone: string): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Upsert: one current code per phone.
  await db.query(
    `INSERT INTO otps (phone, code, expires_at)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval)
     ON CONFLICT (phone)
     DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at`,
    [phone, code, String(OTP_TTL_MINUTES)]
  );

  // THIS is the "mock OTP" — look for this line in the server log.
  console.log(`\n========================================`);
  console.log(`  MOCK OTP for ${phone} is: ${code}`);
  console.log(`========================================\n`);
  return code;
}

// Check a code. Returns true only if it matches and has not expired.
// A correct code is deleted so it can't be reused.
export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const result = await db.query(
    "SELECT code, expires_at FROM otps WHERE phone = $1",
    [phone]
  );
  const row = result.rows[0];
  if (!row) return false;

  const valid = row.code === code && new Date(row.expires_at) > new Date();
  if (valid) {
    await db.query("DELETE FROM otps WHERE phone = $1", [phone]);
  }
  return valid;
}

// ---- JWT (the login token) --------------------------------------------
export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}
