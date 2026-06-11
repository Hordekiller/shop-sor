"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface WalletUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
  userName: string;
  userId: number;
}

const TX_LABELS: Record<string, string> = {
  DEPOSIT: "واریز",
  WITHDRAWAL: "برداشت",
  PAYMENT: "پرداخت",
  REFUND: "بازگشت",
  BONUS: "پاداش",
  ADMIN_ADJUST: "تعدیل ادمین",
};

const TX_COLORS: Record<string, string> = {
  DEPOSIT: "#28C76F",
  WITHDRAWAL: "#FF4C51",
  PAYMENT: "#FF9F43",
  REFUND: "#00BAD1",
  BONUS: "#A855F7",
  ADMIN_ADJUST: "#64748B",
};

export default function WalletPage() {
  const [tab, setTab] = useState<"users" | "transactions" | "settings">(
    "users",
  );
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [adjustUserId, setAdjustUserId] = useState<number | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);

  const [bonusPct, setBonusPct] = useState(0);
  const [bonusFrom, setBonusFrom] = useState("");
  const [bonusTo, setBonusTo] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await api.get<WalletUser[]>(`/admin/wallet/users${params}`);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchTxns = async (page = 1) => {
    const data = await api.get<{
      data: Transaction[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/wallet/transactions?page=${page}`);
    setTxns(data.data || []);
    setTxTotal(data.total || 0);
    setTxPage(data.page || 1);
  };

  const fetchSettings = async () => {
    const data = await api.get<{
      bonusPercent: number;
      bonusFromDate: string;
      bonusToDate: string;
    }>("/admin/wallet/settings");
    setBonusPct(data.bonusPercent || 0);
    setBonusFrom(data.bonusFromDate ? data.bonusFromDate.slice(0, 16) : "");
    setBonusTo(data.bonusToDate ? data.bonusToDate.slice(0, 16) : "");
  };

  useEffect(() => {
    fetchUsers();
    fetchTxns();
    fetchSettings();
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUserId || !adjustAmount) return;
    setAdjusting(true);
    try {
      await api.post(`/admin/wallet/${adjustUserId}/adjust`, {
        amount: parseInt(adjustAmount),
        description: adjustDesc,
      });
      setAdjustUserId(null);
      setAdjustAmount("");
      setAdjustDesc("");
      fetchUsers();
      fetchTxns();
    } catch (err: any) {
      alert(err.message || "خطا در تعدیل کیف پول");
    } finally {
      setAdjusting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put("/admin/wallet/settings", {
        bonusPercent: bonusPct,
        bonusFromDate: bonusFrom || null,
        bonusToDate: bonusTo || null,
      });
      alert("تنظیمات ذخیره شد");
    } catch {
      alert("خطا در ذخیره تنظیمات");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
          کیف پول
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--v-text-secondary)" }}
        >
          مدیریت کیف پول کاربران و تنظیمات پاداش
        </p>
      </div>

      <div
        className="flex gap-1 mb-6 p-1 rounded-xl"
        style={{ background: "var(--v-bg)" }}
      >
        {(
          [
            { key: "users", label: "کاربران", icon: "tabler:users" },
            { key: "transactions", label: "تراکنش‌ها", icon: "tabler:receipt" },
            {
              key: "settings",
              label: "تنظیمات پاداش",
              icon: "tabler:settings",
            },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition flex-1 justify-center ${
              tab === t.key ? "bg-white shadow-sm" : "hover:bg-white/50"
            }`}
            style={{
              color:
                tab === t.key ? "var(--v-primary)" : "var(--v-text-secondary)",
            }}
          >
            <Icon icon={t.icon} className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div className="v-card p-4 mb-4 flex gap-3">
            <input
              className="v-input flex-1"
              placeholder="جستجوی کاربر (نام، ایمیل، موبایل)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            />
            <button onClick={fetchUsers} className="v-btn v-btn-primary">
              <Icon icon="tabler:search" className="w-4 h-4" />
              جستجو
            </button>
          </div>

          <div className="v-card overflow-hidden">
            <table className="v-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>ایمیل</th>
                  <th>موبایل</th>
                  <th className="text-left">موجودی</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-sm"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      در حال بارگذاری...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-sm"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      کاربری یافت نشد.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.name || "—"}</td>
                      <td
                        className="text-sm"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        {u.email || "—"}
                      </td>
                      <td
                        className="text-sm"
                        style={{ color: "var(--v-text-secondary)" }}
                        dir="ltr"
                      >
                        {u.phone || "—"}
                      </td>
                      <td
                        className="font-bold text-left"
                        style={{
                          color:
                            u.balance > 0
                              ? "#28C76F"
                              : "var(--v-text-secondary)",
                        }}
                      >
                        {u.balance.toLocaleString()} تومان
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setAdjustUserId(u.id);
                            setAdjustAmount("");
                            setAdjustDesc("");
                          }}
                          className="v-btn v-btn-sm v-btn-secondary"
                        >
                          <Icon icon="tabler:coin" className="w-3.5 h-3.5" />
                          شارژ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "transactions" && (
        <div className="v-card overflow-hidden">
          <table className="v-table">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>نوع</th>
                <th className="text-left">مبلغ</th>
                <th className="text-left">مانده</th>
                <th>توضیحات</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    تراکنشی یافت نشد.
                  </td>
                </tr>
              ) : (
                txns.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-medium text-sm">{tx.userName}</td>
                    <td>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: `${TX_COLORS[tx.type] || "#94a3b8"}20`,
                          color: TX_COLORS[tx.type] || "#94a3b8",
                        }}
                      >
                        {TX_LABELS[tx.type] || tx.type}
                      </span>
                    </td>
                    <td
                      className={`font-bold text-left text-sm`}
                      style={{ color: tx.amount >= 0 ? "#28C76F" : "#FF4C51" }}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount.toLocaleString()}
                    </td>
                    <td
                      className="text-left text-sm"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      {tx.balanceAfter?.toLocaleString()}
                    </td>
                    <td
                      className="text-sm max-w-[200px] truncate"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      {tx.description || "—"}
                    </td>
                    <td
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      {new Date(tx.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {txTotal > 30 && (
            <div className="flex justify-center gap-2 p-4">
              <button
                disabled={txPage <= 1}
                onClick={() => fetchTxns(txPage - 1)}
                className="v-btn v-btn-sm v-btn-secondary"
              >
                قبلی
              </button>
              <span
                className="text-sm px-3 py-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {txPage} از {Math.ceil(txTotal / 30)}
              </span>
              <button
                disabled={txPage >= Math.ceil(txTotal / 30)}
                onClick={() => fetchTxns(txPage + 1)}
                className="v-btn v-btn-sm v-btn-secondary"
              >
                بعدی
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="v-card p-5 max-w-lg space-y-5">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--v-text)" }}
            >
              درصد پاداش شارژ
            </label>
            <input
              type="number"
              className="v-input"
              value={bonusPct}
              onChange={(e) => setBonusPct(parseFloat(e.target.value) || 0)}
              placeholder="مثال: ۲۰"
              min="0"
              max="100"
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--v-text-disabled)" }}
            >
              اگر کاربری کیف پول خود را شارژ کند، این درصد به عنوان پاداش به
              حسابش واریز می‌شود.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--v-text)" }}
              >
                از تاریخ
              </label>
              <input
                type="datetime-local"
                className="v-input"
                value={bonusFrom}
                onChange={(e) => setBonusFrom(e.target.value)}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--v-text)" }}
              >
                تا تاریخ
              </label>
              <input
                type="datetime-local"
                className="v-input"
                value={bonusTo}
                onChange={(e) => setBonusTo(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--v-text-disabled)" }}>
            اگر بازه زمانی خالی بماند، پاداش همیشه فعال است.
          </p>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="v-btn v-btn-primary"
          >
            {savingSettings ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </button>
        </div>
      )}

      {adjustUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg mb-1">تعدیل کیف پول</h3>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--v-text-secondary)" }}
            >
              کاربر: #{adjustUserId}
            </p>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  مبلغ (تومان)
                </label>
                <input
                  type="number"
                  className="v-input"
                  required
                  placeholder="مثبت = شارژ، منفی = برداشت"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  توضیحات (اختیاری)
                </label>
                <input
                  type="text"
                  className="v-input"
                  placeholder="مثال: پاداش فروش ویژه"
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={adjusting}
                  className="v-btn v-btn-primary flex-1"
                >
                  {adjusting ? "در حال اجرا..." : "تأیید"}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustUserId(null)}
                  className="v-btn v-btn-secondary"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
