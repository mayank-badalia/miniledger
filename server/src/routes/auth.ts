// Login routes: request an OTP, then verify it to get a login token.

import { Router } from "express";
import { db } from "../db";
import { createOtp, verifyOtp, signToken } from "../auth";
import { requestOtpSchema, verifyOtpSchema } from "../validation";

const router = Router();

// POST /api/auth/request-otp  { phone }
// Generates a code and prints it to the server log (mock SMS).
router.post("/request-otp", async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const code = await createOtp(parsed.data.phone);

  // DEMO MODE (opt-in): on a public deployment nobody can see the server log,
  // so a visitor couldn't log in. When DEMO_SHOW_OTP=true we return the code
  // to the browser so the login screen can show it. This is intentionally
  // insecure (anyone can log in as any number) and is meant only for a demo.
  const demo = process.env.DEMO_SHOW_OTP === "true";
  res.json({
    ok: true,
    message: "OTP sent — check the server log.",
    ...(demo ? { devCode: code } : {}),
  });
});

// POST /api/auth/verify-otp  { phone, code }
// If the code is right, find-or-create the user and return a token.
router.post("/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { phone, code } = parsed.data;
  if (!(await verifyOtp(phone, code))) {
    return res.status(401).json({ error: "That code is wrong or expired." });
  }

  // Find the user by phone, or create them on first login.
  const existing = await db.query("SELECT id FROM users WHERE phone = $1", [phone]);
  let userId: number;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
  } else {
    const created = await db.query(
      "INSERT INTO users (phone) VALUES ($1) RETURNING id",
      [phone]
    );
    userId = created.rows[0].id;
  }

  const token = signToken(userId);
  res.json({ ok: true, token, phone });
});

export default router;
