// The "add an entry" form: friend name, amount, due date, optional receipt.
// It validates on the client (same rules as the server) for instant
// feedback, then posts as multipart/form-data so the photo can ride along.

import { useState, FormEvent } from "react";
import { api, Loan } from "../lib/api";
import { useToast } from "./Toast";
import { Magnetic } from "./Magnetic";

export function AddLoanForm({ onCreated }: { onCreated: (loan: Loan) => void }) {
  const toast = useToast();

  const [friend, setFriend] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Mirror the server's rules so users see mistakes before submitting.
  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!friend.trim()) next.friend = "Who did you lend to?";
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0)
      next.amount = "Enter an amount greater than 0.";
    if (!dueDate) next.dueDate = "Pick a due date.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      // FormData lets us send the file and the text fields together.
      const body = new FormData();
      body.append("friend_name", friend.trim());
      body.append("amount", amount);
      body.append("due_date", dueDate);
      if (receipt) body.append("receipt", receipt);

      const loan = await api.post<Loan>("/loans", body);
      onCreated(loan);
      toast.show(`Added ${loan.friend_name}'s loan`);

      // Reset the form for the next entry.
      setFriend("");
      setAmount("");
      setDueDate("");
      setReceipt(null);
      setErrors({});
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card addform" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="friend">Friend's name</label>
        <input
          id="friend"
          className="input"
          value={friend}
          onChange={(e) => setFriend(e.target.value)}
          placeholder="e.g. Asha"
        />
        {errors.friend && <span className="field-error">{errors.friend}</span>}
      </div>

      <div className="addform__row">
        <div className="field">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            id="amount"
            className="input"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>

        <div className="field">
          <label htmlFor="due">Due date</label>
          <input
            id="due"
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="receipt">Receipt photo (optional)</label>
        <input
          id="receipt"
          className="input"
          type="file"
          accept="image/*"
          onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
        />
      </div>

      <Magnetic>
        <button className="btn btn--amber addform__submit" disabled={saving}>
          {saving ? "Saving…" : "Add loan entry"}
        </button>
      </Magnetic>
    </form>
  );
}
