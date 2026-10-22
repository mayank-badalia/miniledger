// Login routes: request an OTP, then verify it to get a login token.

import { Router } from "express";
import { db } from "../db";
import { createOtp, verifyOtp, signToken } from "../auth";
import { requestOtpSchema, verifyOtpSchema } from "../validation";

const router = Router();

// POST /api/auth/request-otp  { phone }
// Generates a code and prints it to the server log (mock SMS).
router.post("/request-otp", (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  createOtp(parsed.data.phone);
  res.json({ ok: true, message: "OTP sent — check the server log." });
});

// POST /api/auth/verify-otp  { phone, code }
// If the code is right, find-or-create the user and return a token.
router.post("/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { phone, code } = parsed.data;
  if (!verifyOtp(phone, code)) {
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
