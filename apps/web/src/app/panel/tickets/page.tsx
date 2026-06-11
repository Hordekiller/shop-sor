"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replies: {
    id: number;
    message: string;
    createdAt: string;
    isAdmin: boolean;
  }[];
}

export default function PanelTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await api.get<Ticket[]>("/tickets");
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSaving(true);
    try {
      await api.post("/tickets", { subject, message });
      setSubject("");
      setMessage("");
      setShowForm(false);
      fetchTickets();
    } catch (err: any) {
      alert(err?.message || "خطا در ارسال تیکت");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (s: string) => {
    const m: Record<string, { label: string; color: string }> = {
      open: { label: "باز", color: "#28C76F" },
      answered: { label: "پاسخ داده شده", color: "#FF9F43" },
      closed: { label: "بسته شده", color: "#6B7280" },
    };
    const b = m[s] || { label: s, color: "#64748B" };
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full text-white"
        style={{ background: b.color }}
      >
        {b.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--dk-text)" }}>
          تیکت‌های پشتیبانی
        </h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setSelectedTicket(null);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
          style={{ background: "var(--dk-primary)" }}
        >
          <Icon icon="tabler:plus" className="w-4 h-4" />
          تیکت جدید
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-[var(--dk-border)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">تیکت جدید</h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <Icon icon="tabler:x" className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">موضوع *</label>
              <input
                type="text"
                required
                className="v-input w-full"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="موضوع تیکت..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">پیام *</label>
              <textarea
                required
                rows={4}
                className="v-input w-full"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="متن پیام خود را وارد کنید..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: "var(--dk-border)" }}
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--dk-primary)" }}
              >
                {saving ? "در حال ارسال..." : "ارسال تیکت"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl animate-pulse"
            style={{ background: "#e5e7eb" }}
          />
        ))
      ) : tickets.length === 0 && !showForm ? (
        <div className="text-center py-20">
          <Icon
            icon="tabler:headset"
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--dk-text-disabled)" }}
          />
          <h2
            className="font-bold text-lg mb-2"
            style={{ color: "var(--dk-text)" }}
          >
            تیکتی ثبت نشده است
          </h2>
          <p className="text-sm" style={{ color: "var(--dk-text-light)" }}>
            برای ارتباط با پشتیبانی، تیکت جدید ثبت کنید
          </p>
        </div>
      ) : selectedTicket ? (
        <div className="bg-white rounded-xl border border-[var(--dk-border)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">{selectedTicket.subject}</h3>
              <span
                className="text-xs"
                style={{ color: "var(--dk-text-light)" }}
              >
                {new Date(selectedTicket.createdAt).toLocaleDateString("fa-IR")}
              </span>
            </div>
            {statusBadge(selectedTicket.status)}
          </div>
          <div className="bg-[var(--dk-bg)] rounded-lg p-4 text-sm">
            {selectedTicket.message}
          </div>
          {selectedTicket.replies?.map((r) => (
            <div
              key={r.id}
              className={`rounded-lg p-4 text-sm ${r.isAdmin ? "bg-blue-50 border border-blue-200 mr-8" : "bg-[var(--dk-bg)] ml-8"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-xs">
                  {r.isAdmin ? "پشتیبانی" : "شما"}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--dk-text-light)" }}
                >
                  {new Date(r.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
              {r.message}
            </div>
          ))}
          <button
            onClick={() => setSelectedTicket(null)}
            className="text-sm"
            style={{ color: "var(--dk-primary)" }}
          >
            بازگشت به لیست
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className="bg-white rounded-xl border border-[var(--dk-border)] p-4 cursor-pointer hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">{t.subject}</h3>
                {statusBadge(t.status)}
              </div>
              <p
                className="text-sm line-clamp-2"
                style={{ color: "var(--dk-text-light)" }}
              >
                {t.message}
              </p>
              <div
                className="flex items-center gap-3 mt-2 text-xs"
                style={{ color: "var(--dk-text-light)" }}
              >
                <span>{new Date(t.createdAt).toLocaleDateString("fa-IR")}</span>
                {t.replies?.length > 0 && <span>{t.replies.length} پاسخ</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
