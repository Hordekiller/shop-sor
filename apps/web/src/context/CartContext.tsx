"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

interface CartItem {
  id?: number;
  productId: number;
  variantId?: number;
  variantName?: string;
  title: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
  slug?: string;
  isActive?: boolean;
  weight?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: number, variantId?: number) => Promise<void>;
  updateQuantity: (
    productId: number,
    quantity: number,
    variantId?: number,
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  loading: boolean;
  saveForLater: (productId: number, variantId?: number) => Promise<void>;
  moveToCart: (productId: number, variantId?: number) => Promise<void>;
  savedItems: CartItem[];
}

const CartContext = createContext<CartContextType | null>(null);

function itemKey(item: CartItem) {
  return `${item.productId}-${item.variantId ?? ""}`;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("web_token");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const prevToken = useRef<string | null>(null);

  const fetchServerCart = useCallback(async () => {
    try {
      const data: any[] = await api.get("/cart");
      return data.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId ?? undefined,
        variantName: i.variantName ?? undefined,
        title: i.title,
        price: i.price,
        image: i.image,
        quantity: i.quantity,
        stock: i.stock,
        slug: i.slug,
        isActive: i.isActive,
      })) as CartItem[];
    } catch {
      return null;
    }
  }, []);

  const mergeLocalIntoServer = useCallback(async () => {
    let localItems: CartItem[] = [];
    try {
      const raw = localStorage.getItem("cart");
      if (raw) localItems = JSON.parse(raw);
    } catch {}
    if (localItems.length === 0) return;

    try {
      await api.post(
        "/cart/merge",
        localItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      );
    } catch {
      // Fallback: merge one by one
      await Promise.all(
        localItems.map((item) =>
          api
            .post("/cart/add", {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })
            .catch(() => {}),
        ),
      );
    }
    localStorage.removeItem("cart");
  }, []);

  const reloadCart = useCallback(async () => {
    const token = getToken();
    const wasLoggedIn = prevToken.current;
    prevToken.current = token;
    setIsLoggedIn(!!token);

    if (token) {
      if (!wasLoggedIn) {
        await mergeLocalIntoServer();
      }
      const data = await fetchServerCart();
      if (data) setItems(data);
    } else {
      try {
        const saved = localStorage.getItem("cart");
        if (saved) setItems(JSON.parse(saved));
        else setItems([]);
      } catch {
        setItems([]);
      }
    }
    setLoading(false);
  }, [fetchServerCart, mergeLocalIntoServer]);

  // Init: detect auth + load cart
  useEffect(() => {
    reloadCart();
  }, [reloadCart]);

  // Listen for auth changes (login/logout from other pages)
  useEffect(() => {
    const handleAuth = () => {
      setLoading(true);
      reloadCart();
    };
    window.addEventListener("auth:change", handleAuth);
    return () => window.removeEventListener("auth:change", handleAuth);
  }, [reloadCart]);

  // Persist to localStorage for guests
  useEffect(() => {
    if (!isLoggedIn && !loading) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, isLoggedIn, loading]);

  const addItem = useCallback(
    async (item: CartItem) => {
      if (isLoggedIn) {
        await api.post("/cart/add", {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
        const data = await fetchServerCart();
        if (data) setItems(data);
      } else {
        const max = item.maxOrderQty || item.stock || 99;
        const min = item.minOrderQty || 1;
        const clampedQty = Math.max(min, Math.min(item.quantity, max));
        setItems((prev) => {
          const existing = prev.find((i) => itemKey(i) === itemKey(item));
          if (existing) {
            const newQty = Math.min(existing.quantity + clampedQty, max);
            return prev.map((i) =>
              itemKey(i) === itemKey(item)
                ? { ...i, quantity: Math.min(newQty, item.stock) }
                : i,
            );
          }
          return [
            ...prev,
            { ...item, quantity: Math.min(clampedQty, item.stock) },
          ];
        });
      }
    },
    [isLoggedIn, fetchServerCart],
  );

  const removeItem = useCallback(
    async (productId: number, variantId?: number) => {
      if (isLoggedIn) {
        const qs = variantId ? `?variantId=${variantId}` : "";
        await api.delete(`/cart/remove/${productId}${qs}`);
        const data = await fetchServerCart();
        if (data) setItems(data);
      } else {
        setItems((prev) =>
          prev.filter((i) => itemKey(i) !== `${productId}-${variantId ?? ""}`),
        );
      }
    },
    [isLoggedIn, fetchServerCart],
  );

  const updateQuantity = useCallback(
    async (productId: number, quantity: number, variantId?: number) => {
      if (isLoggedIn) {
        await api.put("/cart/update", { productId, quantity, variantId });
        const data = await fetchServerCart();
        if (data) setItems(data);
      } else {
        setItems((prev) =>
          prev.map((i) => {
            if (
              i.productId !== productId ||
              (i.variantId ?? "") !== (variantId ?? "")
            )
              return i;
            const min = i.minOrderQty || 1;
            const max = i.maxOrderQty || i.stock || 99;
            return { ...i, quantity: Math.max(min, Math.min(quantity, max)) };
          }),
        );
      }
    },
    [isLoggedIn, fetchServerCart],
  );

  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      await api.delete("/cart/clear");
    }
    setItems([]);
  }, [isLoggedIn]);

  // ─── Save for Later ─────────────────────────────

  const loadSavedItems = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const data: any[] = await api.get("/cart/saved-items");
        setSavedItems(
          data.map((i: any) => ({
            productId: i.productId,
            variantId: i.variantId ?? undefined,
            variantName: i.variantName ?? undefined,
            title: i.title,
            price: i.price,
            image: i.image,
            stock: i.stock,
            slug: i.slug,
            quantity: 1,
          })),
        );
      } catch {}
    } else {
      try {
        const saved = localStorage.getItem("saved_items");
        if (saved) setSavedItems(JSON.parse(saved));
        else setSavedItems([]);
      } catch {
        setSavedItems([]);
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!loading) loadSavedItems();
  }, [loading, loadSavedItems]);

  useEffect(() => {
    if (!isLoggedIn && !loading) {
      localStorage.setItem("saved_items", JSON.stringify(savedItems));
    }
  }, [savedItems, isLoggedIn, loading]);

  const saveForLater = useCallback(
    async (productId: number, variantId?: number) => {
      if (isLoggedIn) {
        await api.post("/cart/save-for-later", { productId, variantId });
        const [cartData, savedData] = await Promise.all([
          fetchServerCart(),
          api.get<any[]>("/cart/saved-items"),
        ]);
        if (cartData) setItems(cartData);
        setSavedItems(
          savedData.map((i: any) => ({
            productId: i.productId,
            variantId: i.variantId ?? undefined,
            variantName: i.variantName ?? undefined,
            title: i.title,
            price: i.price,
            image: i.image,
            stock: i.stock,
            slug: i.slug,
            quantity: 1,
          })),
        );
      } else {
        setItems((prev) => {
          const item = prev.find(
            (i) => itemKey(i) === `${productId}-${variantId ?? ""}`,
          );
          if (!item) return prev;
          const rest = prev.filter(
            (i) => itemKey(i) !== `${productId}-${variantId ?? ""}`,
          );
          setSavedItems((s) => [...s, { ...item, quantity: 1 }]);
          return rest;
        });
      }
    },
    [isLoggedIn, fetchServerCart],
  );

  const moveToCart = useCallback(
    async (productId: number, variantId?: number) => {
      if (isLoggedIn) {
        await api.post("/cart/move-to-cart", { productId, variantId });
        const [cartData, savedData] = await Promise.all([
          fetchServerCart(),
          api.get<any[]>("/cart/saved-items"),
        ]);
        if (cartData) setItems(cartData);
        setSavedItems(
          savedData.map((i: any) => ({
            productId: i.productId,
            variantId: i.variantId ?? undefined,
            variantName: i.variantName ?? undefined,
            title: i.title,
            price: i.price,
            image: i.image,
            stock: i.stock,
            slug: i.slug,
            quantity: 1,
          })),
        );
      } else {
        setSavedItems((prev) => {
          const item = prev.find(
            (i) => itemKey(i) === `${productId}-${variantId ?? ""}`,
          );
          if (!item) return prev;
          const rest = prev.filter(
            (i) => itemKey(i) !== `${productId}-${variantId ?? ""}`,
          );
          setItems((c) => [...c, { ...item, quantity: 1 }]);
          return rest;
        });
      }
    },
    [isLoggedIn, fetchServerCart],
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        loading,
        saveForLater,
        moveToCart,
        savedItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
