import { API_URL } from "./media";

export { API_URL };

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("web_token");
}

export const api = {
  get: async <T>(path: string, options?: RequestInit): Promise<T> => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ message: "خطا در ارتباط با سرور" }));
      throw new Error(err.message || err.error || "خطا");
    }
    return res.json();
  },

  post: async <T>(
    path: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "خطا" }));
      throw new Error(err.message || "خطا");
    }
    return res.json();
  },

  put: async <T>(
    path: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "خطا" }));
      throw new Error(err.message || "خطا");
    }
    return res.json();
  },

  delete: async <T>(path: string, options?: RequestInit): Promise<T> => {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "خطا" }));
      throw new Error(err.message || "خطا");
    }
    return res.json();
  },
};
