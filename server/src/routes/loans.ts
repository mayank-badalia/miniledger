// Loan routes: list, create (with optional receipt photo), and mark repaid.
// Every route here is protected by requireAuth, so req.userId is always set.
//
// Receipts are stored IN THE DATABASE (as raw bytes), not on disk. That's so
// the app works on serverless hosting like Vercel, where the local filesystem
// isn't permanent. Each loan returns its receipt as a "data URL" the browser
// can show directly in an <img>, so no extra authenticated request is needed.

import { Router } from "express";
import multer from "multer";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { createLoanSchema } from "../validation";

const router = Router();

// multer with memoryStorage keeps the uploaded file in RAM as a Buffer
// (req.file.buffer) instead of writing it to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max (hosted bodies are capped)
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

// Turn a database row into the shape the frontend wants.
function toLoan(row: any) {
  const hasReceipt = !!row.receipt_data;
  return {
    id: row.id,
    friend_name: row.friend_name,
    amount: Number(row.amount),
    due_date: row.due_date, // "YYYY-MM-DD"
    repaid: row.repaid,
    repaid_at: row.repaid_at,
    // A data URL like "data:image/jpeg;base64,...." that <img> can render.
    receipt_url: hasReceipt
      ? `data:${row.receipt_mime};base64,${row.receipt_data.toString("base64")}`
      : null,
    created_at: row.created_at,
  };
}

// The columns we read for the list. (We include the receipt bytes so the
// thumbnails show; fine for an app with a handful of entries.)
const LOAN_COLUMNS =
  "id, friend_name, amount, due_date, repaid, repaid_at, receipt_mime, receipt_data, created_at";

// GET /api/loans  -> all of my loans, newest first.
router.get("/", requireAuth, async (req, res) => {
  const result = await db.query(
    `SELECT ${LOAN_COLUMNS} FROM loans WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  );
  res.json(result.rows.map(toLoan));
});

// POST /api/loans  -> add a new loan. Accepts an optional "receipt" image
// sent as multipart/form-data so the file can ride along with the fields.
router.post("/", requireAuth, upload.single("receipt"), async (req, res) => {
  const parsed = createLoanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { friend_name, amount, due_date } = parsed.data;
  const mime = req.file ? req.file.mimetype : null;
  const data = req.file ? req.file.buffer : null;

  const result = await db.query(
    `INSERT INTO loans (user_id, friend_name, amount, due_date, receipt_mime, receipt_data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${LOAN_COLUMNS}`,
    [req.userId, friend_name, amount, due_date, mime, data]
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
      RETURNING ${LOAN_COLUMNS}`,
    [repaid, id, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Loan not found." });
  }
  res.json(toLoan(result.rows[0]));
});

export default router;
