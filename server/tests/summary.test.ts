// Tests for the summary math. No database needed — just the pure function.

import { describe, it, expect } from "vitest";
import { computeSummary, LoanRow } from "../src/summary";

// Pretend "today" is 15 June 2026 for every test so results are stable.
const TODAY = new Date(2026, 5, 15);

describe("computeSummary", () => {
  it("adds up lent, repaid and outstanding", () => {
    const loans: LoanRow[] = [
      { amount: 100, due_date: "2026-07-01", repaid: false },
      { amount: 50, due_date: "2026-07-01", repaid: true },
    ];
    const s = computeSummary(loans, TODAY);
    expect(s.totalLent).toBe(150);
    expect(s.totalRepaid).toBe(50);
    expect(s.outstanding).toBe(100);
  });

  it("counts an unpaid, past-due loan as overdue", () => {
    const loans: LoanRow[] = [
      { amount: 200, due_date: "2026-06-01", repaid: false }, // before today
    ];
    const s = computeSummary(loans, TODAY);
    expect(s.overdue).toBe(200);
  });

  it("does NOT count a repaid loan as overdue, even if past due", () => {
    const loans: LoanRow[] = [
      { amount: 200, due_date: "2026-06-01", repaid: true },
    ];
    const s = computeSummary(loans, TODAY).overdue;
    expect(s).toBe(0);
  });

  it("does NOT count a future-due loan as overdue", () => {
    const loans: LoanRow[] = [
      { amount: 200, due_date: "2026-12-01", repaid: false },
    ];
    expect(computeSummary(loans, TODAY).overdue).toBe(0);
  });

  it("handles pg's string amounts and empty lists", () => {
    expect(computeSummary([], TODAY).totalLent).toBe(0);
    const s = computeSummary([{ amount: "10.50", due_date: "2026-07-01", repaid: false }], TODAY);
    expect(s.totalLent).toBe(10.5);
  });
});
