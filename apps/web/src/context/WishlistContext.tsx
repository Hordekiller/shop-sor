"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { api } from "@/lib/api";

interface WishlistContextType {
  wishlisted: Set<number>;
  toggle: (productId: number) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlisted, setWishlisted] = useState<Set<number>>(new Set());
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("web_token"));
  }, []);

  const refresh = useCallback(async () => {
    const t = localStorage.getItem("web_token");
    if (!t) {
      setWishlisted(new Set());
      return;
    }
    try {
      const res = await api.get<{ data: any[] }>("/wishlist?limit=1000");
      setWishlisted(new Set(res.data.map((w: any) => w.product.id)));
    } catch {
      setWishlisted(new Set());
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, token]);

  const toggle = async (productId: number) => {
    const t = localStorage.getItem("web_token");
    if (!t) {
      window.location.href = "/auth/login";
      return;
    }
    try {
      if (wishlisted.has(productId)) {
        await api.delete(`/wishlist/${productId}`);
        setWishlisted((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await api.post(`/wishlist/${productId}`, {});
        setWishlisted((prev) => new Set(prev).add(productId));
      }
    } catch {
      /* ignore */
    }
  };

  const isWishlisted = (productId: number) => wishlisted.has(productId);

  return (
    <WishlistContext.Provider
      value={{ wishlisted, toggle, isWishlisted, refresh }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
