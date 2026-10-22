// Auth state for the whole app, shared through React Context.
// It remembers whether you're logged in (we store the token in localStorage)
// and exposes login() / logout().

import { createContext, useContext, useState, ReactNode } from "react";
import { tokenStore } from "./api";

interface AuthValue {
  isLoggedIn: boolean;
  phone: string | null;
  login: (token: string, phone: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const PHONE_KEY = "miniledger_phone";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start from whatever is already saved, so a refresh keeps you logged in.
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [phone, setPhone] = useState<string | null>(() => localStorage.getItem(PHONE_KEY));

  function login(newToken: string, newPhone: string) {
    tokenStore.set(newToken);
    localStorage.setItem(PHONE_KEY, newPhone);
    setToken(newToken);
    setPhone(newPhone);
  }

  function logout() {
    tokenStore.clear();
    localStorage.removeItem(PHONE_KEY);
    setToken(null);
    setPhone(null);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, phone, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Handy hook so components can do: const { isLoggedIn, login } = useAuth();
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
