// The main screen once you're logged in.
// It loads your summary and your loans, then shows:
//   - a summary card (animated numbers)
//   - the infinite tape
//   - "Needs attention" reminders (overdue + soonest-due) [bonus feature]
//   - the full list of entries, overdue ones highlighted
//   - the add-entry form

import { useEffect, useState, useMemo } from "react";
import { api, Loan, Summary } from "../lib/api";
import { useAuth } from "../lib/auth";
import { isOverdue, dueLabel, money } from "../lib/format";
import { SummaryCard } from "../components/SummaryCard";
import { LoanCard } from "../components/LoanCard";
import { AddLoanForm } from "../components/AddLoanForm";
import { Marquee } from "../components/Marquee";
import { Reveal } from "../components/Reveal";
import { useToast } from "../components/Toast";
import { ScrollTrigger } from "../lib/motion";

const EMPTY_SUMMARY: Summary = { totalLent: 0, totalRepaid: 0, outstanding: 0, overdue: 0 };

export function Dashboard() {
  const { phone, logout } = useAuth();
  const toast = useToast();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  // Load everything from the server.
  async function refresh() {
    const [loanList, sum] = await Promise.all([
      api.get<Loan[]>("/loans"),
      api.get<Summary>("/summary"),
    ]);
    setLoans(loanList);
    setSummary(sum);
    // Content height changed -> let ScrollTrigger recompute reveal positions.
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  useEffect(() => {
    refresh()
      .catch((err) => toast.show(err.message ?? "Could not load your data", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark repaid / undo, then refresh the numbers.
  async function toggleRepaid(loan: Loan) {
    try {
      await api.patch<Loan>(`/loans/${loan.id}/repaid`, { repaid: !loan.repaid });
      await refresh();
      toast.show(loan.repaid ? "Marked as unpaid" : `${loan.friend_name} repaid 🎉`);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not update", "error");
    }
  }

  // "Needs attention" = unpaid loans, soonest due first (so overdue lead).
  const reminders = useMemo(
    () =>
      loans
        .filter((l) => !l.repaid)
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 5),
    [loans]
  );

  return (
    <div className="dash">
      {/* Top bar */}
      <header className="dash__bar container">
        <span className="dash__logo">
          Mini<em>Ledger</em>
        </span>
        <div className="dash__who">
          <span className="dash__phone">{phone}</span>
          <button className="dash__logout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {/* Hero + summary */}
      <section className="dash__hero container">
        <span className="eyebrow">Your ledger</span>
        <h1 className="display dash__title">
          Here's what's
          <br />
          out in the world.
        </h1>
        <SummaryCard summary={summary} />
      </section>

      <Marquee
        items={["total lent", "repaid", "outstanding", "overdue", "all in one place"]}
        direction={-1}
      />

      {/* Reminders — the bonus feature */}
      {reminders.length > 0 && (
        <section className="dash__section container">
          <Reveal>
            <div className="dash__sectionhead">
              <span className="eyebrow">Reminders</span>
              <h2 className="display dash__h2">Needs your attention</h2>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="reminders">
              {reminders.map((l) => {
                const over = isOverdue(l.due_date, l.repaid);
                return (
                  <div
                    key={l.id}
                    className={"reminder" + (over ? " reminder--overdue" : "")}
                  >
                    <span className="reminder__name">{l.friend_name}</span>
                    <span className="money reminder__amt">{money(l.amount)}</span>
                    <span className="reminder__due">{dueLabel(l.due_date, l.repaid)}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>
      )}

      {/* All entries */}
      <section className="dash__section container">
        <Reveal>
          <div className="dash__sectionhead">
            <span className="eyebrow">All entries</span>
            <h2 className="display dash__h2">
              {loading ? "Loading…" : `${loans.length} loan${loans.length === 1 ? "" : "s"}`}
            </h2>
          </div>
        </Reveal>

        {!loading && loans.length === 0 && (
          <Reveal>
            <p className="dash__empty">
              No entries yet. Add your first loan below and it'll show up here.
            </p>
          </Reveal>
        )}

        <div className="loans">
          {loans.map((loan, i) => (
            <Reveal key={loan.id} delay={Math.min(i * 0.04, 0.3)}>
              <LoanCard loan={loan} onToggleRepaid={toggleRepaid} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Add entry */}
      <section className="dash__section container">
        <Reveal>
          <div className="dash__sectionhead">
            <span className="eyebrow">New entry</span>
            <h2 className="display dash__h2">Add a loan</h2>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <AddLoanForm onCreated={() => refresh()} />
        </Reveal>
      </section>

      <footer className="dash__footer container">
        <span>MiniLedger · built with React, GSAP & Lenis</span>
      </footer>
    </div>
  );
}
