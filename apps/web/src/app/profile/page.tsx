'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { toJalaliHuman } from '@/lib/date';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('web_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    api.get<User>('/auth/me')
      .then((u) => {
        setUser(u);
        setForm({ name: u.name || '', phone: u.phone || '' });
      })
      .catch(() => {
        localStorage.removeItem('web_token');
        router.push('/auth/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put<User>('/auth/profile', form);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || 'خطا');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('web_token');
    router.push('/');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="animate-pulse bg-white rounded-xl p-6 shadow-sm h-64" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">پروفایل</h1>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400">عضویت: {user && toJalaliHuman(user.createdAt)}</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
              <input
                type="text"
                required
                className="w-full rounded-lg border px-4 py-3 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره موبایل</label>
              <input
                type="tel"
                className="w-full rounded-lg border px-4 py-3 text-sm"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'در حال ذخیره...' : saved ? '✓ ذخیره شد' : 'ذخیره'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-50 px-6 py-2 text-sm text-red-600 hover:bg-red-100"
              >
                خروج
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/orders" className="flex-1 rounded-xl bg-white p-4 shadow-sm border text-center hover:border-indigo-300">
            <p className="text-lg font-bold text-indigo-600">سفارشات من</p>
            <p className="text-xs text-gray-500 mt-1">مشاهده تاریخچه سفارشات</p>
          </Link>
        </div>
      </div>
    </>
  );
}
