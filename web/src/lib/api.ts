// A tiny wrapper around fetch so the rest of the app can say
// api.get("/loans") instead of repeating headers and error handling.

// Where the backend lives. In dev, Vite proxies "/api" to port 4000,
// so the default empty base just works. You can override it with
// VITE_API_URL for a deployed backend.
const BASE = import.meta.env.VITE_API_URL ?? "";

// We keep the login token in localStorage so it survives page refreshes.
const TOKEN_KEY = "miniledger_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Core request function. Adds the token header and turns error responses
// into thrown Errors with the server's message.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Only set JSON content-type when we're not sending a FormData (file upload),
  // because the browser must set that header itself for FormData.
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE}/api${path}`, { ...options, headers });
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

// ---- The shapes of data the API returns (shared across the app) ----
export interface Loan {
  id: number;
  friend_name: string;
  amount: number;
  due_date: string; // "YYYY-MM-DD"
  repaid: boolean;
  repaid_at: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  overdue: number;
}
