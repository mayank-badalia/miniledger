// Login helpers: the mock OTP store and the JWT (login token) functions.

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-super-secret-change-me";

// ---- Mock OTP store ----------------------------------------------------
// In a real app an SMS provider would text the code to the user. Here we
// keep the code in memory for a few minutes and PRINT IT TO THE SERVER LOG,
// exactly as the brief asked. One code per phone number at a time.

interface StoredOtp {
  code: string;
  expiresAt: number; // unix ms
}

const otpStore = new Map<string, StoredOtp>();
const OTP_TTL_MS = 5 * 60 * 1000; // codes last 5 minutes

// Create a 6-digit code, remember it, log it, and return it.
export function createOtp(phone: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS });

  // THIS is the "mock OTP" — look for this line in the server terminal.
  console.log(`\n========================================`);
  console.log(`  MOCK OTP for ${phone} is: ${code}`);
  console.log(`========================================\n`);
  return code;
}

// Check a code. Returns true only if it matches and has not expired.
export function verifyOtp(phone: string, code: string): boolean {
  const stored = otpStore.get(phone);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  if (stored.code !== code) return false;

  otpStore.delete(phone); // one-time use
  return true;
}

// ---- JWT (the login token) --------------------------------------------
// After a correct OTP we hand the browser a signed token. The browser
// sends it back on every request so we know which user is calling.

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
