"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

const STORAGE_KEY = "atlas_compare";
const MAX_ITEMS = 4;

interface CompareContextType {
  items: number[];
  add: (productId: number) => void;
  remove: (productId: number) => void;
  toggle: (productId: number) => void;
  has: (productId: number) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

function load(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<number[]>([]);

  useEffect(() => {
    setItems(load());
  }, []);

  const save = (next: number[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const add = (productId: number) => {
    const current = load();
    if (current.includes(productId)) return;
    if (current.length >= MAX_ITEMS) return;
    save([...current, productId]);
  };

  const remove = (productId: number) => {
    save(load().filter((id) => id !== productId));
  };

  const toggle = (productId: number) => {
    const current = load();
    if (current.includes(productId)) {
      save(current.filter((id) => id !== productId));
    } else {
      if (current.length >= MAX_ITEMS) return;
      save([...current, productId]);
    }
  };

  const has = (productId: number) => load().includes(productId);

  const clear = () => save([]);

  return (
    <CompareContext.Provider value={{ items, add, remove, toggle, has, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
