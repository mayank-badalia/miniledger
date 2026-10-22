// The summary card at the top of the dashboard. Four figures, with the
// numbers rolling up via <CountUp>. Overdue is shown in the alert colour.

import { Summary } from "../lib/api";
import { money } from "../lib/format";
import { CountUp } from "./CountUp";

export function SummaryCard({ summary }: { summary: Summary }) {
  const stats = [
    { label: "Total lent", value: summary.totalLent, tone: "ink" },
    { label: "Repaid", value: summary.totalRepaid, tone: "ink" },
    { label: "Still owed to you", value: summary.outstanding, tone: "amber" },
    { label: "Overdue", value: summary.overdue, tone: "alert" },
  ] as const;

  return (
    <div className="summary">
      {stats.map((s) => (
        <div className="summary__item" key={s.label}>
          <span className="eyebrow">{s.label}</span>
          <CountUp
            value={s.value}
            format={money}
            className={`money summary__value summary__value--${s.tone}`}
          />
        </div>
      ))}
    </div>
  );
}
