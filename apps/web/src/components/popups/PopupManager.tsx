"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";

interface Popup {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
  btnText: string;
  type: "center" | "bottom_sheet" | "top_banner";
  displayMode: "once" | "each_visit" | "daily";
  delay: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

function shouldShow(id: number, mode: Popup["displayMode"]): boolean {
  if (typeof window === "undefined") return false;
  const key = `popup_${id}`;
  if (mode === "once") {
    if (localStorage.getItem(key)) return false;
  } else if (mode === "each_visit") {
    if (sessionStorage.getItem(key)) return false;
  } else if (mode === "daily") {
    const stored = localStorage.getItem(key);
    if (stored === new Date().toDateString()) return false;
  }
  return true;
}

function markShown(id: number, mode: Popup["displayMode"]): void {
  if (typeof window === "undefined") return;
  const key = `popup_${id}`;
  if (mode === "once" || mode === "daily") {
    localStorage.setItem(
      key,
      mode === "daily" ? new Date().toDateString() : "1",
    );
  } else if (mode === "each_visit") {
    sessionStorage.setItem(key, "1");
  }
}

function isInRange(startAt?: string, endAt?: string): boolean {
  const now = Date.now();
  if (startAt && new Date(startAt).getTime() > now) return false;
  if (endAt && new Date(endAt).getTime() < now) return false;
  return true;
}

export default function PopupManager() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [current, setCurrent] = useState<Popup | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/v1/popups")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.popups ?? []);
        const active = list.filter(
          (p: Popup) => p.isActive && isInRange(p.startAt, p.endAt),
        );
        setPopups(active);
      })
      .catch(() => {});
  }, []);

  const tryShowNext = useCallback(() => {
    const unseen = popups.find((p) => shouldShow(p.id, p.displayMode));
    if (unseen) {
      setCurrent(unseen);
      markShown(unseen.id, unseen.displayMode);
      setTimeout(() => setVisible(true), unseen.delay ?? 3000);
    }
  }, [popups]);

  useEffect(() => {
    if (popups.length === 0 || current) return;
    const timer = setTimeout(tryShowNext, 500);
    return () => clearTimeout(timer);
  }, [popups, current, tryShowNext]);

  const close = useCallback(() => {
    setVisible(false);
    setCurrent(null);
  }, []);

  if (!current || popups.length === 0) return null;

  const backdrop = current.type === "center";

  return (
    <>
      {backdrop && visible && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] transition-opacity"
          onClick={close}
        />
      )}
      {visible && (
        <div
          className={`fixed z-[100] transition-all duration-300 ${
            current.type === "center"
              ? "inset-0 flex items-center justify-center p-4"
              : current.type === "bottom_sheet"
                ? "bottom-0 left-0 right-0"
                : "top-0 left-0 right-0"
          }`}
        >
          <div
            className={`relative bg-white ${
              current.type === "center"
                ? "max-w-sm w-full rounded-2xl shadow-xl"
                : current.type === "bottom_sheet"
                  ? "w-full rounded-t-2xl shadow-xl"
                  : "w-full shadow-md"
            }`}
          >
            <button
              onClick={close}
              className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors"
              aria-label="بستن"
            >
              <Icon icon="tabler:x" className="w-5 h-5 text-gray-700" />
            </button>
            {current.image && (
              <img
                src={current.image}
                alt={current.title}
                className="w-full object-cover rounded-t-2xl"
                loading="lazy"
              />
            )}
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900">
                {current.title}
              </h3>
              {current.description && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {current.description}
                </p>
              )}
              {current.link && (
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 w-full text-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--dk-primary, #8b5cf6)" }}
                >
                  {current.btnText || "مشاهده"}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
