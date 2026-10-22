// The login screen. Two steps on one page:
//   1. Enter phone  -> ask the server to "send" an OTP (printed to its log)
//   2. Enter the 6-digit code -> verify and log in
// A GSAP timeline plays a calm intro the first time it mounts.

import { useState, useRef, useLayoutEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/Toast";
import { Marquee } from "../components/Marquee";
import { Magnetic } from "../components/Magnetic";
import { gsap, reduceMotion } from "../lib/motion";

const TAPE = [
  "lend without losing track",
  "no more awkward reminders",
  "your money, remembered",
  "friends stay friends",
];

export function Login() {
  const { login } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  // Intro animation: stagger the hero pieces up on first paint.
  useLayoutEffect(() => {
    if (reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-intro]", {
        y: 40,
        autoAlpha: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.12,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    if (!/^\+?\d{7,15}$/.test(phone.trim())) {
      toast.show("Enter a valid phone number (7–15 digits).", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<{ devCode?: string }>("/auth/request-otp", {
        phone: phone.trim(),
      });
      setStep("code");
      // In demo mode the server returns the code so we can show it here;
      // otherwise it's printed to the server terminal.
      if (res.devCode) {
        setCode(res.devCode);
        toast.show(`Demo mode — your code is ${res.devCode}`);
      } else {
        toast.show("OTP sent — check the server terminal 👀");
      }
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post<{ token: string; phone: string }>("/auth/verify-otp", {
        phone: phone.trim(),
        code: code.trim(),
      });
      login(res.token, res.phone); // this swaps the app over to the dashboard
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Wrong code", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login" ref={rootRef}>
      <section className="login__hero container">
        <span className="eyebrow" data-intro>
          MiniLedger
        </span>
        <h1 className="display login__title" data-intro>
          Lend money.
          <br />
          <em>Never</em> lose track.
        </h1>
        <p className="login__sub" data-intro>
          A tiny, beautiful ledger for the cash you front your friends — who owes
          what, what's due, and what's overdue.
        </p>

        <div className="login__card card" data-intro>
          {step === "phone" ? (
            <form onSubmit={sendOtp}>
              <div className="field">
                <label htmlFor="phone">Your phone number</label>
                <input
                  id="phone"
                  className="input"
                  inputMode="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
              </div>
              <Magnetic>
                <button className="btn btn--amber login__btn" disabled={busy}>
                  {busy ? "Sending…" : "Send OTP"}
                </button>
              </Magnetic>
              <p className="login__hint">
                This is a demo: the OTP is printed in the server's terminal, not
                texted.
              </p>
            </form>
          ) : (
            <form onSubmit={verify}>
              <div className="field">
                <label htmlFor="code">Enter the 6-digit code</label>
                <input
                  id="code"
                  className="input login__code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
              </div>
              <Magnetic>
                <button className="btn btn--amber login__btn" disabled={busy}>
                  {busy ? "Checking…" : "Verify & enter"}
                </button>
              </Magnetic>
              <button
                type="button"
                className="login__back"
                onClick={() => setStep("phone")}
              >
                ← use a different number
              </button>
            </form>
          )}
        </div>
      </section>

      <Marquee items={TAPE} />
    </div>
  );
}
