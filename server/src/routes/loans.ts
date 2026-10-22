// Loan routes: list, create (with optional receipt photo), and mark repaid.
// Every route here is protected by requireAuth, so req.userId is always set.

import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { createLoanSchema } from "../validation";

const router = Router();

// ---- Receipt photo upload (multer) ------------------------------------
// Save uploaded files to the /uploads folder with a random, safe name.
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    // Only allow images.
    cb(null, file.mimetype.startsWith("image/"));
  },
});

// Turn a database row into the shape the frontend wants (numbers, full URL).
function toLoan(row: any) {
  return {
    id: row.id,
    friend_name: row.friend_name,
    amount: Number(row.amount),
    due_date: row.due_date, // a DATE like "2026-11-01"
    repaid: row.repaid,
    repaid_at: row.repaid_at,
    receipt_url: row.receipt_path ? `/uploads/${row.receipt_path}` : null,
    created_at: row.created_at,
  };
}

// GET /api/loans  -> all of my loans, newest first.
router.get("/", requireAuth, async (req, res) => {
  const result = await db.query(
    "SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC",
    [req.userId]
  );
  res.json(result.rows.map(toLoan));
});

// POST /api/loans  -> add a new loan. Accepts an optional "receipt" image.
// Sent as multipart/form-data so a file can ride along with the fields.
router.post("/", requireAuth, upload.single("receipt"), async (req, res) => {
  const parsed = createLoanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { friend_name, amount, due_date } = parsed.data;
  const receiptName = req.file ? req.file.filename : null;

  const result = await db.query(
    `INSERT INTO loans (user_id, friend_name, amount, due_date, receipt_path)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.userId, friend_name, amount, due_date, receiptName]
  );
  res.status(201).json(toLoan(result.rows[0]));
});

// PATCH /api/loans/:id/repaid  -> mark a loan as repaid (or back to unpaid).
router.patch("/:id/repaid", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Bad loan id." });
  }

  // Default to true, but allow { repaid: false } to undo.
  const repaid = req.body?.repaid === false ? false : true;

  const result = await db.query(
    `UPDATE loans
        SET repaid = $1,
            repaid_at = CASE WHEN $1 THEN now() ELSE NULL END
      WHERE id = $2 AND user_id = $3
      RETURNING *`,
    [repaid, id, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Loan not found." });
  }
  res.json(toLoan(result.rows[0]));
});

export default router;
