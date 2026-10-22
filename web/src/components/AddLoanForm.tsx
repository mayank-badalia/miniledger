// The "add an entry" form: friend name, amount, due date, optional receipt.
// It validates on the client (same rules as the server) for instant
// feedback, then posts as multipart/form-data so the photo can ride along.

import { useState, useRef, useEffect, FormEvent } from "react";
import { api, Loan } from "../lib/api";
import { useToast } from "./Toast";
import { Magnetic } from "./Magnetic";

export function AddLoanForm({ onCreated }: { onCreated: (loan: Loan) => void }) {
  const toast = useToast();

  const [friend, setFriend] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // local image preview
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // We keep a ref to the hidden <input> so we can clear it after saving.
  const fileRef = useRef<HTMLInputElement>(null);

  // When a photo is chosen, make a temporary preview URL for it. We free
  // the old URL whenever it changes, and when the form unmounts, to avoid
  // memory leaks.
  function onPickFile(file: File | null) {
    // Keep receipts small: hosted (serverless) request bodies are capped, so
    // we reject anything over 2 MB up front with a clear message.
    if (file && file.size > 2 * 1024 * 1024) {
      toast.show("That image is over 2 MB — please pick a smaller one.", "error");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setReceipt(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file ? URL.createObjectURL(file) : null;
    });
  }
  function clearFile() {
    onPickFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }
  useEffect(() => {
    // Cleanup the preview URL when the component goes away.
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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
      clearFile();
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
        <label>Receipt photo (optional)</label>

        {/* The real file input is visually hidden. We open it PROGRAMMATICALLY
            by clicking the box below (via the ref) — this is the most reliable
            way across browsers. Clicking the box works whether it's empty or
            already showing a preview (so you can swap the photo). */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="dropzone__input"
          tabIndex={-1}
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />

        <div
          className={"dropzone" + (preview ? " dropzone--filled" : "")}
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
        >
          {preview ? (
            <>
              <img className="dropzone__thumb" src={preview} alt="Receipt preview" />
              <div className="dropzone__meta">
                <span className="dropzone__name">{receipt?.name}</span>
                <span className="dropzone__size">
                  {receipt ? `${Math.round(receipt.size / 1024)} KB · tap to change` : ""}
                </span>
              </div>
              <button
                type="button"
                className="dropzone__remove"
                onClick={(e) => {
                  e.stopPropagation(); // don't re-open the picker
                  clearFile();
                }}
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 16V7m0 0-3.5 3.5M12 7l3.5 3.5M5 20h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Click to add a photo</span>
              <span className="dropzone__hint">PNG or JPG, up to 2&nbsp;MB</span>
            </>
          )}
        </div>
      </div>

      <Magnetic>
        <button className="btn btn--amber addform__submit" disabled={saving}>
          {saving ? "Saving…" : "Add loan entry"}
        </button>
      </Magnetic>
    </form>
  );
}
