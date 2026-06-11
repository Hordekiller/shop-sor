'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [form, setForm] = useState({
    siteName: 'فروشگاه اطلس شاپ',
    siteDescription: 'فروشگاه اینترنتی چند فروشندگی',
    supportEmail: 'info@atlas-shop.com',
    supportPhone: '۰۲۱-۱۲۳۴۵۶۷۸',
    defaultShipping: 'post_pishtaz',
    currency: 'ریال',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">تنظیمات</h2>

      <form onSubmit={handleSave} className="max-w-2xl space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام فروشگاه</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل پشتیبانی</label>
            <input
              type="email"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات فروشگاه</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              value={form.siteDescription}
              onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تلفن پشتیبانی</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.supportPhone}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">روش پیش‌فرض ارسال</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.defaultShipping}
              onChange={(e) => setForm({ ...form, defaultShipping: e.target.value })}
            >
              <option value="post_pishtaz">پست پیشتاز</option>
              <option value="post_sefareshi">پست سفارشی</option>
              <option value="tipax">تیپاکس</option>
              <option value="mahax">ماهکس</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700"
        >
          {saved ? '✓ ذخیره شد' : 'ذخیره تنظیمات'}
        </button>
      </form>
    </div>
  );
}
