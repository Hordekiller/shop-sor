'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Header from '@/components/Header';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.post<{ token: string }>('/auth/register', form);
      localStorage.setItem('web_token', token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="mx-auto max-w-sm px-4 py-16">
        <div className="bg-white rounded-xl p-8 shadow-sm border">
          <h1 className="text-xl font-bold text-center mb-6">ثبت‌نام</h1>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 text-center">{error}</div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              required
              placeholder="نام و نام خانوادگی"
              className="w-full rounded-lg border px-4 py-3 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              required
              placeholder="ایمیل"
              className="w-full rounded-lg border px-4 py-3 text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="tel"
              placeholder="شماره موبایل (اختیاری)"
              className="w-full rounded-lg border px-4 py-3 text-sm"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="رمز عبور (حداقل ۶ کاراکتر)"
              className="w-full rounded-lg border px-4 py-3 text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-3 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            حساب کاربری دارید؟{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:underline">ورود</Link>
          </p>
        </div>
      </div>
    </>
  );
}
