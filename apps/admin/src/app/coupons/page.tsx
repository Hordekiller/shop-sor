'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  maxUses: number;
  usedCount: number;
  minOrder: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', maxUses: '100', minOrder: '0' });

  const fetchCoupons = async () => {
    try {
      const data = await api.get<Coupon[]>('/coupons');
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        code: form.code,
        type: form.type,
        value: parseInt(form.value),
        maxUses: parseInt(form.maxUses) || 100,
        minOrder: parseInt(form.minOrder) || 0,
      });
      setShowForm(false);
      setForm({ code: '', type: 'percent', value: '', maxUses: '100', minOrder: '0' });
      fetchCoupons();
    } catch (err) {
      alert(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      alert(err);
    }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/coupons/${id}`, { isActive: !isActive });
      fetchCoupons();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">تخفیف‌ها</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          {showForm ? 'انصراف' : 'تخفیف جدید'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="کد تخفیف"
            required
            className="rounded-lg border px-3 py-2 text-sm flex-1"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="percent">درصد</option>
            <option value="fixed">مبلغ ثابت</option>
          </select>
          <input
            type="number"
            placeholder="مقدار"
            required
            className="rounded-lg border px-3 py-2 text-sm w-24"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          <input
            type="number"
            placeholder="حداکثر استفاده"
            className="rounded-lg border px-3 py-2 text-sm w-32"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          />
          <input
            type="number"
            placeholder="حداقل سفارش"
            className="rounded-lg border px-3 py-2 text-sm w-32"
            value={form.minOrder}
            onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            ایجاد
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">در حال بارگذاری...</p>
      ) : coupons.length === 0 ? (
        <p className="text-gray-500">هیچ تخفیفی یافت نشد.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-right">
              <tr>
                <th className="px-4 py-3 font-medium">شناسه</th>
                <th className="px-4 py-3 font-medium">کد</th>
                <th className="px-4 py-3 font-medium">نوع</th>
                <th className="px-4 py-3 font-medium">مقدار</th>
                <th className="px-4 py-3 font-medium">استفاده</th>
                <th className="px-4 py-3 font-medium">حداقل سفارش</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{c.id}</td>
                  <td className="px-4 py-3 font-medium">{c.code}</td>
                  <td className="px-4 py-3">{c.type === 'percent' ? 'درصد' : 'ثابت'}</td>
                  <td className="px-4 py-3">{c.type === 'percent' ? `%${c.value}` : `${c.value.toLocaleString()} ریال`}</td>
                  <td className="px-4 py-3">{c.usedCount}/{c.maxUses}</td>
                  <td className="px-4 py-3">{c.minOrder.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(c.id, c.isActive)}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.isActive ? 'فعال' : 'غیرفعال'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
