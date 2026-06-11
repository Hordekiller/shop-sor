"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import Header from "@/components/Header";

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string | null;
  balanceAfter: number | null;
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const {
    balance,
    loading: walletLoading,
    refresh: refreshWallet,
  } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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

    api
      .get<{
        data: Transaction[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/wallet/transactions?page=${page}`)
      .then((res) => {
        setTransactions(res.data);
        setTotalPages(res.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router, page]);

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return;
    setDepositing(true);
    try {
      await api.post("/wallet/deposit", {
        amount,
        description: "واریز آنلاین",
      });
      setShowDeposit(false);
      setDepositAmount("");
      await refreshWallet();
      const res = await api.get<{
        data: Transaction[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/wallet/transactions?page=1`);
      setTransactions(res.data);
      setPage(1);
    } catch (err: any) {
      alert(err.message || "خطا");
    } finally {
      setDepositing(false);
    }
  };

  const typeLabel: Record<string, string> = {
    DEPOSIT: "واریز",
    WITHDRAWAL: "برداشت",
    PAYMENT: "پرداخت",
    REFUND: "استرداد",
    ADMIN_ADJUST: "تعدیل توسط مدیریت",
  };

  const typeColor: Record<string, string> = {
    DEPOSIT: "text-green-600 bg-green-50",
    WITHDRAWAL: "text-red-600 bg-red-50",
    PAYMENT: "text-red-600 bg-red-50",
    REFUND: "text-green-600 bg-green-50",
    ADMIN_ADJUST: "text-blue-600 bg-blue-50",
  };

  return (
    <>
      <Header />
      <div className="dk-container py-6">
        <nav className="text-xs text-[var(--dk-text-light)] mb-5">
          <Link href="/" className="hover:text-[var(--dk-primary)]">
            خانه
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--dk-text)]">کیف پول</span>
        </nav>

        {/* Balance Card */}
        <div
          className="dk-card p-6 mb-6 text-center"
          style={{
            background: "linear-gradient(135deg, var(--dk-primary), #5a4bd1)",
            color: "white",
          }}
        >
          <p className="text-sm opacity-80 mb-2">موجودی کیف پول</p>
          <p className="text-4xl font-bold mb-4">
            {walletLoading ? "..." : balance.toLocaleString()} تومان
          </p>
          <button
            onClick={() => setShowDeposit(!showDeposit)}
            className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition"
          >
            افزایش موجودی
          </button>
        </div>

        {showDeposit && (
          <div className="dk-card p-4 mb-6 max-w-sm mx-auto">
            <h3 className="text-sm font-bold mb-3">افزایش موجودی</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="مبلغ به تومان"
                className="flex-1 rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
              />
              <button
                onClick={handleDeposit}
                disabled={depositing || !depositAmount}
                className="dk-btn-primary text-sm disabled:opacity-50"
              >
                {depositing ? "..." : "واریز"}
              </button>
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="dk-card p-5">
          <h3 className="font-bold text-sm mb-4">تاریخچه تراکنش‌ها</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-[var(--dk-bg)] rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-[var(--dk-text-light)] text-center py-8">
              تراکنشی یافت نشد
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--dk-bg)]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColor[tx.type] || "text-gray-600 bg-gray-100"}`}
                    >
                      {typeLabel[tx.type] || tx.type}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.description || typeLabel[tx.type] || tx.type}
                      </p>
                      <p className="text-xs text-[var(--dk-text-light)]">
                        {new Date(tx.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-sm font-bold ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount.toLocaleString()} تومان
                    </p>
                    {tx.balanceAfter != null && (
                      <p className="text-xs text-[var(--dk-text-light)]">
                        موجودی: {tx.balanceAfter.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-30"
              >
                قبلی
              </button>
              <span className="text-sm text-[var(--dk-text-light)]">
                صفحه {page} از {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-30"
              >
                بعدی
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
