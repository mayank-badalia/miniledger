// Small formatting helpers for money and dates, kept in one place.

// Show amounts as rupees, e.g. 1500 -> "₹1,500".
// (Change "en-IN"/"INR" here to switch currency everywhere.)
export function money(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// Show a date like "10 Jan 2026".
export function prettyDate(iso: string): string {
  const d = new Date(iso + "T00:00:00"); // treat as a plain calendar date
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// True if a loan is overdue: not repaid AND its due date is before today.
export function isOverdue(dueDateIso: string, repaid: boolean): boolean {
  if (repaid) return false;
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(dueDateIso + "T00:00:00");
  return due < todayMidnight;
}

// A friendly "due in 3 days" / "2 days overdue" label.
export function dueLabel(dueDateIso: string, repaid: boolean): string {
  if (repaid) return "Repaid";
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(dueDateIso + "T00:00:00");
  const days = Math.round((due.getTime() - todayMidnight.getTime()) / 86_400_000);

  if (days === 0) return "Due today";
  if (days > 0) return days === 1 ? "Due tomorrow" : `Due in ${days} days`;
  const late = Math.abs(days);
  return late === 1 ? "1 day overdue" : `${late} days overdue`;
}
