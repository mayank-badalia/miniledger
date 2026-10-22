// The summary math lives in its OWN pure function so it is trivial to test
// (no database, no network — just numbers in, numbers out).

export interface LoanRow {
  amount: number | string; // pg returns NUMERIC as a string, so allow both
  due_date: string | Date;
  repaid: boolean;
}

export interface Summary {
  totalLent: number; // sum of every loan you ever gave
  totalRepaid: number; // sum of the loans marked repaid
  outstanding: number; // still owed to you = lent - repaid
  overdue: number; // not repaid AND past the due date
}

// Returns midnight of the given day, so "overdue" compares dates, not times.
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function computeSummary(loans: LoanRow[], today: Date = new Date()): Summary {
  const todayMidnight = startOfDay(today);
  let totalLent = 0;
  let totalRepaid = 0;
  let overdue = 0;

  for (const loan of loans) {
    const amount = Number(loan.amount);
    totalLent += amount;

    if (loan.repaid) {
      totalRepaid += amount;
    } else if (startOfDay(new Date(loan.due_date)) < todayMidnight) {
      // Not repaid and the due date has already passed -> overdue.
      overdue += amount;
    }
  }

  return {
    totalLent: round2(totalLent),
    totalRepaid: round2(totalRepaid),
    outstanding: round2(totalLent - totalRepaid),
    overdue: round2(overdue),
  };
}

// Round to 2 decimal places to avoid floating-point noise like 0.1 + 0.2.
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
