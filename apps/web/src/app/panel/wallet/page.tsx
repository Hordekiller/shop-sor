"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import { toJalaliHuman } from "@/lib/date";

interface Transaction {
  id: number;
  type: "DEPOSIT" | "WITHDRAWAL" | "PURCHASE" | "REFUND";
  amount: number;
  description: string;
  createdAt: string;
}

const txLabels: Record<string, string> = {
  DEPOSIT: "واریز",
  WITHDRAWAL: "برداشت",
  PURCHASE: "خرید",
  REFUND: "بازگشت وجه",
  BONUS: "پاداش",
  ADMIN_ADJUST: "تعدیل توسط ادمین",
};

const txIcons: Record<string, string> = {
  DEPOSIT: "tabler:arrow-up-circle",
  WITHDRAWAL: "tabler:arrow-down-circle",
  PURCHASE: "tabler:shopping-cart-minus",
  REFUND: "tabler:refresh",
  BONUS: "tabler:gift",
  ADMIN_ADJUST: "tabler:building-bank",
};

const txColors: Record<string, string> = {
  DEPOSIT: "#28C76F",
  WITHDRAWAL: "#FF4C51",
  PURCHASE: "#FF9F43",
  REFUND: "#00BAD1",
  BONUS: "#A855F7",
  ADMIN_ADJUST: "#64748B",
};

const txBgColors: Record<string, string> = {
  DEPOSIT: "rgba(40,199,111,0.12)",
  WITHDRAWAL: "rgba(255,76,81,0.12)",
  PURCHASE: "rgba(255,159,67,0.12)",
  REFUND: "rgba(0,186,209,0.12)",
  BONUS: "rgba(168,85,247,0.12)",
  ADMIN_ADJUST: "rgba(100,116,139,0.12)",
};

export default function PanelWallet() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    Promise.all([
      api.get<{ balance: number }>("/wallet/balance"),
      api.get<{ data: Transaction[] }>("/wallet/transactions"),
    ])
      .then(([bal, txs]) => {
        setBalance(bal.balance);
        setTransactions(txs.data || []);
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(depositAmount);
    if (!amount || amount < 1000) return;
    setDepositing(true);
    try {
      const res = await api.post<{ authority: string }>("/wallet/deposit", {
        amount,
      });
      if (res.authority) {
        window.location.href = `https://www.zarinpal.com/pg/StartPay/${res.authority}`;
      } else {
        alert("اتصال به درگاه پرداخت با مشکل مواجه شد.");
      }
    } catch {
      alert("خطا در ایجاد تراکنش");
    } finally {
      setDepositing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div
          className="h-32 rounded-2xl animate-pulse"
          style={{ background: "#e5e7eb" }}
        />
        <div
          className="h-48 rounded-2xl animate-pulse"
          style={{ background: "#e5e7eb" }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1
        className="text-xl font-bold mb-1"
        style={{ color: "var(--dk-text)" }}
      >
        کیف پول
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--dk-text-light)" }}>
        مدیریت کیف پول و تراکنش‌ها
      </p>

      {/* Balance Card */}
      <div
        className="rounded-2xl p-6 mb-6 text-white"
        style={{
          background: "linear-gradient(135deg, #7367F0 0%, #9B59B6 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm opacity-90">موجودی کیف پول</p>
          <Icon icon="tabler:wallet" className="w-8 h-8 opacity-80" />
        </div>
        <p className="text-3xl font-bold mb-4">
          {balance.toLocaleString()}{" "}
          <span className="text-sm font-normal opacity-80 mr-1">تومان</span>
        </p>
        <button
          onClick={() => setShowDeposit(!showDeposit)}
          className="px-5 py-2 rounded-xl text-sm font-medium bg-white/20 hover:bg-white/30 transition"
        >
          <Icon icon="tabler:plus" className="w-4 h-4 inline ml-1" />
          افزایش موجودی
        </button>
      </div>

      {/* Deposit Form */}
      {showDeposit && (
        <form
          onSubmit={handleDeposit}
          className="rounded-2xl border bg-white p-5 mb-6"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <h2 className="font-bold text-sm mb-4">افزایش موجودی</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="مبلغ به تومان"
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
                min="1000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={depositing}
              className="px-6 py-2.5 rounded-xl text-sm text-white font-medium transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--dk-primary)" }}
            >
              {depositing ? "در حال اتصال..." : "پرداخت"}
            </button>
          </div>
        </form>
      )}

      {/* Transactions */}
      <div
        className="rounded-2xl border bg-white"
        style={{ borderColor: "var(--dk-border)" }}
      >
        <div
          className="p-4 border-b font-medium text-sm"
          style={{ borderColor: "var(--dk-border)" }}
        >
          تاریخچه تراکنش‌ها
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <Icon
              icon="tabler:receipt-off"
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "var(--dk-text-light)" }}
            />
            <p className="text-sm" style={{ color: "var(--dk-text-light)" }}>
              تراکنشی ثبت نشده است.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--dk-border)" }}>
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 p-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: txBgColors[tx.type] }}
                >
                  <Icon
                    icon={txIcons[tx.type]}
                    className="w-4 h-4"
                    style={{ color: txColors[tx.type] }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{txLabels[tx.type]}</p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "var(--dk-text-light)" }}
                  >
                    {tx.description || "—"}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--dk-text-light)" }}
                  >
                    {toJalaliHuman(tx.createdAt)}
                  </p>
                </div>
                <span
                  className="font-bold text-sm shrink-0"
                  style={{
                    color:
                      tx.type === "DEPOSIT" || tx.type === "REFUND"
                        ? "#28C76F"
                        : "#FF4C51",
                  }}
                >
                  {tx.type === "DEPOSIT" || tx.type === "REFUND" ? "+" : "-"}
                  {tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
