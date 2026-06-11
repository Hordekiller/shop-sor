"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

interface WalletContextType {
  balance: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("web_token");
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (token) {
      try {
        const res = await api.get<{ balance: number }>("/wallet/balance");
        setBalance(res.balance);
      } catch {
        setBalance(0);
      }
    } else {
      setBalance(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh on auth change
  useEffect(() => {
    const handleAuth = () => refresh();
    window.addEventListener("auth:change", handleAuth);
    return () => window.removeEventListener("auth:change", handleAuth);
  }, [refresh]);

  return (
    <WalletContext.Provider value={{ balance, loading, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
