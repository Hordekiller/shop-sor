"use client";

import { useCompare } from "@/context/CompareContext";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScaleBalanced, faTimes } from "@fortawesome/free-solid-svg-icons";

export default function CompareBar() {
  const { items, clear } = useCompare();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
      <div className="bg-white rounded-2xl shadow-xl border border-[var(--dk-border)] px-5 py-3 flex items-center gap-4 pointer-events-auto max-w-md w-full">
        <button
          onClick={clear}
          className="text-[var(--dk-text-light)] hover:text-red-500 transition shrink-0"
        >
          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FontAwesomeIcon
            icon={faScaleBalanced}
            className="text-[var(--dk-primary)] shrink-0"
          />
          <span className="text-sm text-[var(--dk-text)] truncate">
            {items.length} محصول برای مقایسه
          </span>
        </div>
        <Link
          href="/compare"
          className="dk-btn-primary text-xs px-4 py-2 rounded-xl shrink-0"
        >
          مقایسه کنید
        </Link>
      </div>
    </div>
  );
}
