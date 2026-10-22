# MiniLedger

A small, good‑looking web app to track money you lend to friends — who owes
what, what's due, and what's overdue. Phone + OTP login, add/repay loans, and a
live summary, wrapped in a cinematic, animated interface.

> **Note on the stack.** The original brief said "React Native". The design
> brief that came with it (GSAP, Lenis smooth scroll, infinite marquee tapes)
> is made of **web** technologies that don't exist in React Native, so this is
> built as a **responsive React web app** — you get every animation that was
> asked for, and it runs on phone and desktop. See _Design & motion_ below.

---

## ✨ Features

**Required**
- 📱 **Phone login with a mock OTP** — the 6‑digit code is printed to the
  **server log** (no real SMS). Enter it to log in. A token (JWT) keeps you
  logged in.
- ➕ **Add a loan** — friend name, amount, due date.
- ✅ **Mark as repaid** (and undo).
- 📊 **Summary endpoint** — total lent, total repaid, outstanding, and overdue.
- 🔴 **Overdue entries highlighted** in the list.
- 🧾 Summary card at the top + form to add entries.

**Bonus (both implemented)**
- 📷 **Receipt photo upload** per loan (stored on disk, shown as a thumbnail).
- 🔔 **Reminders view** — a "Needs your attention" strip of unpaid loans,
  soonest‑due first, overdue ones in red.
- ✔️ **Input validation** (client *and* server) and **unit tests**.

**Design & motion** (the fun part)
- GSAP + ScrollTrigger scroll reveals, Lenis smooth scrolling, an infinite
  marquee "tape", count‑up animated numbers, a custom cursor, and magnetic
  buttons. All of it respects `prefers-reduced-motion`.

---

## 🧱 Tech stack

| Layer     | Tech                                                        |
|-----------|-------------------------------------------------------------|
| Backend   | Node + TypeScript, Express, **PostgreSQL** (raw SQL via `pg`) |
| Auth      | Mock OTP (in‑memory) + JWT                                   |
| Uploads   | `multer` → `server/uploads/`                                |
| Validation| `zod`                                                       |
| Tests     | `vitest`                                                    |
| Frontend  | React + TypeScript + Vite                                  |
| Motion    | **GSAP**, ScrollTrigger, **Lenis**                         |
| Fonts     | Fraunces (display), Inter (UI), JetBrains Mono (money)     |

No ORM and no router — just plain SQL and a simple logged‑in / logged‑out
switch — so the code stays easy to read and explain.

---

## 📁 Project structure

```
miniledger/
├── docker-compose.yml        # one-command PostgreSQL
├── server/                   # the API
│   ├── src/
│   │   ├── index.ts          # entry point (start DB + listen)
│   │   ├── app.ts            # builds the Express app
│   │   ├── db.ts             # pg pool + runs schema.sql
│   │   ├── schema.sql        # the two tables (users, loans)
│   │   ├── auth.ts           # mock OTP store + JWT helpers
│   │   ├── summary.ts        # computeSummary() — pure, unit-tested
│   │   ├── validation.ts     # zod schemas
│   │   ├── middleware/auth.ts# "require login" middleware
│   │   └── routes/           # auth.ts, loans.ts, summary.ts
│   └── tests/                # summary + validation tests
└── web/                      # the React app
    └── src/
        ├── pages/            # Login.tsx, Dashboard.tsx
        ├── components/       # SummaryCard, LoanCard, AddLoanForm,
        │                     # Marquee, Reveal, CountUp, Cursor, Magnetic, Toast
        ├── lib/              # api, auth, format, motion (gsap), useLenis
        ├── index.css         # design tokens + base styles
        └── app.css           # layout & component styles
```

---

## 🚀 Running it locally

### Prerequisites
- **Node 18+** (built on Node 26)
- **Docker** (for PostgreSQL) — or your own Postgres if you prefer.

### 1. Start the database

From the project root:

```bash
docker compose up -d
```

This starts PostgreSQL on **localhost:5434** with user/password/db all
`miniledger` (see `docker-compose.yml`).

> Don't have Docker? Create a database and set `DATABASE_URL` in `server/.env`
> to point at it. The tables are created automatically on first run.

### 2. Start the API

```bash
cd server
cp .env.example .env     # defaults already match docker-compose
npm install
npm run dev
```

You should see `MiniLedger API running at http://localhost:4000`.
**Keep this terminal visible — your OTP codes print here.**

### 3. Start the web app

In a second terminal:

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:5173**.

### 4. Log in
1. Enter any phone number (e.g. `9876543210`) → **Send OTP**.
2. Look at the **server terminal** for a line like
   `MOCK OTP for 9876543210 is: 123456`.
3. Type that code → you're in.

---

## 🔌 API reference

All loan/summary routes need an `Authorization: Bearer <token>` header
(you get the token from `verify-otp`).

| Method | Path                      | Body                                   | What it does                    |
|--------|---------------------------|----------------------------------------|---------------------------------|
| POST   | `/api/auth/request-otp`   | `{ phone }`                            | Generates + logs a mock OTP     |
| POST   | `/api/auth/verify-otp`    | `{ phone, code }`                      | Verifies → returns `{ token }`  |
| GET    | `/api/loans`              | —                                      | Your loans, newest first        |
| POST   | `/api/loans`              | `multipart`: `friend_name, amount, due_date, receipt?` | Add a loan (+ optional photo) |
| PATCH  | `/api/loans/:id/repaid`   | `{ repaid: boolean }`                  | Mark repaid / undo              |
| GET    | `/api/summary`            | —                                      | `{ totalLent, totalRepaid, outstanding, overdue }` |

---

## 🧪 Tests

```bash
cd server
npm test
```

Covers the summary math (`computeSummary`) and the validation rules — no
database needed.

---

## 🎨 Design & motion notes

- **Theme:** "ledger paper meets modern fintech."
  - **Primary** deep ink‑green `#13211B` · **Secondary** warm paper `#F3ECDD`
    · **Tertiary/accent** amber `#E8B54B` · reserved alert red `#D7503C` for
    overdue only.
- **Type:** Fraunces for headings, Inter for UI, JetBrains Mono for money
  figures (tabular numbers line up like a real ledger).
- **Motion** is set up once in `web/src/lib/motion.ts` (GSAP defaults) and
  `web/src/lib/useLenis.ts` (Lenis driven by the GSAP ticker, so smooth scroll
  and scroll‑triggered animations share one clock). Reusable pieces:
  `<Reveal>`, `<CountUp>`, `<Marquee>`, `<Magnetic>`, `<Cursor>`.
- Everything degrades gracefully with `prefers-reduced-motion: reduce`.

---

## ℹ️ What's mocked / out of scope
- The OTP is **not** texted — it's printed to the server log (as the brief
  asked).
- No real SMS provider, no password, single currency (₹ — change it in
  `web/src/lib/format.ts`).

---

## 🛠️ Troubleshooting
- **Port 5434 already in use?** Change it in `docker-compose.yml` and
  `server/.env`.
- **Vite/vitest complains esbuild binary is missing** (only on setups with an
  `allow-scripts` guard): run `node node_modules/esbuild/install.js` inside the
  affected folder.
- **Can't connect to the database?** Make sure `docker compose up -d` is
  running and `DATABASE_URL` in `server/.env` matches.
