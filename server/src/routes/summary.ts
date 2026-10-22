// Summary route: total lent, total repaid, outstanding, and overdue amount.
// It just reads the user's loans and hands them to computeSummary().

import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { computeSummary } from "../summary";

const router = Router();

// GET /api/summary
router.get("/", requireAuth, async (req, res) => {
  const result = await db.query(
    "SELECT amount, due_date, repaid FROM loans WHERE user_id = $1",
    [req.userId]
  );
  res.json(computeSummary(result.rows));
});

export default router;
