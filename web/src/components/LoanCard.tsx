// One loan in the list. Shows the friend, amount, and due status.
// Overdue (unpaid + past due) loans get a red edge and a pulsing dot.
// If a receipt photo was uploaded, a thumbnail shows and opens full size.

import { Loan } from "../lib/api";
import { money, prettyDate, dueLabel, isOverdue } from "../lib/format";

interface LoanCardProps {
  loan: Loan;
  onToggleRepaid: (loan: Loan) => void;
}

export function LoanCard({ loan, onToggleRepaid }: LoanCardProps) {
  const overdue = isOverdue(loan.due_date, loan.repaid);

  return (
    <article
      className={
        "loan" +
        (overdue ? " loan--overdue" : "") +
        (loan.repaid ? " loan--repaid" : "")
      }
    >
      <div className="loan__main">
        <div className="loan__top">
          <h3 className="loan__name">{loan.friend_name}</h3>
          <span className={"loan__status" + (overdue ? " loan__status--overdue" : "")}>
            {overdue && <span className="loan__dot" aria-hidden="true" />}
            {dueLabel(loan.due_date, loan.repaid)}
          </span>
        </div>

        <div className="loan__bottom">
          <span className="money loan__amount">{money(loan.amount)}</span>
          <span className="loan__due">due {prettyDate(loan.due_date)}</span>
        </div>
      </div>

      {/* Optional receipt thumbnail */}
      {loan.receipt_url && (
        <a
          className="loan__receipt"
          href={loan.receipt_url}
          target="_blank"
          rel="noreferrer"
          title="View receipt"
        >
          <img src={loan.receipt_url} alt={`Receipt for ${loan.friend_name}`} />
        </a>
      )}

      <button
        className={"btn loan__btn" + (loan.repaid ? "" : " btn--amber")}
        onClick={() => onToggleRepaid(loan)}
      >
        {loan.repaid ? "Undo" : "Mark repaid"}
      </button>
    </article>
  );
}
