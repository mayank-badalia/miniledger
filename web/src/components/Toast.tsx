// A very small toast (pop-up message) system. One hook, one component.
// Call `const toast = useToast()` then `toast.show("Saved!")`.

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ToastValue {
  show: (message: string, kind?: "ok" | "error") => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: string } | null>(null);

  const show = useCallback((message: string, kind: "ok" | "error" = "ok") => {
    setToast({ message, kind });
    // Auto-hide after 2.8 seconds.
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.kind === "error" ? "var(--alert)" : "var(--ink)",
            color: "var(--paper)",
            padding: "0.8rem 1.4rem",
            borderRadius: 999,
            fontWeight: 600,
            boxShadow: "var(--shadow)",
            zIndex: 10000,
            animation: "toastIn 0.35s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
