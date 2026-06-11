'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface Slide {
  bg: string;
  title: string;
  desc: string;
}

interface Section {
  type: string;
  title: string;
  sort: string;
  count: number;
  categoryId?: number;
}

interface Category { id: number; name: string }

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    site_name: 'اطلس شاپ',
    site_description: '',
    support_email: '',
    support_phone: '',
    default_shipping: 'post_pishtaz',
    currency: 'تومان',
  });
  const [slides, setSlides] = useState<Slide[]>([
    { bg: 'from-[#ef4056] to-[#d8364a]', title: '', desc: '' },
  ]);
  const [sections, setSections] = useState<Section[]>([
    { type: 'products', title: '', sort: 'newest', count: 12 },
  ]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<Record<string, string>>('/settings'),
    ]).then(([cats, settings]) => {
      setCategories(cats);
      setForm({
        site_name: settings.site_name || 'اطلس شاپ',
        site_description: settings.site_description || '',
        support_email: settings.support_email || '',
        support_phone: settings.support_phone || '',
        default_shipping: settings.default_shipping || 'post_pishtaz',
        currency: settings.currency || 'تومان',
      });
      if (settings.slides) {
        try { setSlides(JSON.parse(settings.slides)); } catch {}
      }
      if (settings.sections) {
        try { setSections(JSON.parse(settings.sections)); } catch {}
      }
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings', {
        ...form,
        slides: JSON.stringify(slides),
        sections: JSON.stringify(sections),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { alert(err); }
  };

  const addSlide = () => setSlides([...slides, { bg: 'from-[#ef4056] to-[#d8364a]', title: '', desc: '' }]);
  const removeSlide = (i: number) => setSlides(slides.filter((_, idx) => idx !== i));
  const updateSlide = (i: number, field: keyof Slide, value: string) => {
    const copy = [...slides]; copy[i] = { ...copy[i], [field]: value }; setSlides(copy);
  };

  const addSection = () => setSections([...sections, { type: 'products', title: '', sort: 'newest', count: 12 }]);
  const removeSection = (i: number) => setSections(sections.filter((_, idx) => idx !== i));
  const updateSection = (i: number, field: keyof Section, value: any) => {
    const copy = [...sections]; (copy[i] as any)[field] = value; setSections(copy);
  };

  if (loading) return <p className="text-gray-500">در حال بارگذاری...</p>;

  const gradients = [
    'from-[#ef4056] to-[#d8364a]', 'from-[#19bfd3] to-[#1599a8]',
    'from-[#f9a825] to-[#e8960c]', 'from-[#6b21a8] to-[#581c87]',
    'from-[#059669] to-[#047857]', 'from-[#2563eb] to-[#1d4ed8]',
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">تنظیمات فروشگاه</h2>

      <form onSubmit={handleSave} className="space-y-8 max-w-3xl">
        {/* Basic */}
        <div className="bg-white rounded-xl p-5 shadow-sm border space-y-4">
          <h3 className="font-semibold text-sm">اطلاعات پایه</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام فروشگاه</label>
              <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.site_name}
                onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل پشتیبانی</label>
              <input type="email" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.support_email}
                onChange={(e) => setForm({ ...form, support_email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تلفن پشتیبانی</label>
              <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.support_phone}
                onChange={(e) => setForm({ ...form, support_phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">واحد پول</label>
              <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات فروشگاه</label>
              <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={form.site_description}
                onChange={(e) => setForm({ ...form, site_description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">روش پیش‌فرض ارسال</label>
              <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.default_shipping}
                onChange={(e) => setForm({ ...form, default_shipping: e.target.value })}>
                <option value="post_pishtaz">پست پیشتاز</option>
                <option value="post_sefareshi">پست سفارشی</option>
                <option value="tipax">تیپاکس</option>
                <option value="mahax">ماهکس</option>
              </select>
            </div>
          </div>
        </div>

        {/* Slides */}
        <div className="bg-white rounded-xl p-5 shadow-sm border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">اسلایدر‌های صفحه اصلی</h3>
            <button type="button" onClick={addSlide} className="text-sm text-indigo-600 hover:underline">+ افزودن اسلاید</button>
          </div>
          {slides.map((slide, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">اسلاید {i + 1}</span>
                <button type="button" onClick={() => removeSlide(i)} className="text-xs text-red-500 hover:underline">حذف</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">عنوان</label>
                  <input type="text" className="w-full rounded-lg border px-3 py-1.5 text-sm mt-1" value={slide.title}
                    onChange={(e) => updateSlide(i, 'title', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">توضیحات</label>
                  <input type="text" className="w-full rounded-lg border px-3 py-1.5 text-sm mt-1" value={slide.desc}
                    onChange={(e) => updateSlide(i, 'desc', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">رنگ پس‌زمینه (گرادینت)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {gradients.map((g) => (
                      <button key={g} type="button" onClick={() => updateSlide(i, 'bg', g)}
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g} ${slide.bg === g ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className={`h-20 rounded-lg bg-gradient-to-br ${slide.bg} flex items-center px-4`}>
                <div className="text-white">
                  <p className="text-sm font-bold">{slide.title || 'عنوان اسلاید'}</p>
                  <p className="text-xs text-white/70">{slide.desc || 'توضیحات'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="bg-white rounded-xl p-5 shadow-sm border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">سکشن‌های صفحه اصلی</h3>
            <button type="button" onClick={addSection} className="text-sm text-indigo-600 hover:underline">+ افزودن سکشن</button>
          </div>
          {sections.map((sec, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">سکشن {i + 1}</span>
                <button type="button" onClick={() => removeSection(i)} className="text-xs text-red-500 hover:underline">حذف</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">عنوان سکشن</label>
                  <input type="text" className="w-full rounded-lg border px-3 py-1.5 text-sm mt-1" value={sec.title}
                    onChange={(e) => updateSection(i, 'title', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">نوع</label>
                  <select className="w-full rounded-lg border px-3 py-1.5 text-sm mt-1" value={sec.type}
                    onChange={(e) => updateSection(i, 'type', e.target.value)}>
                    <option value="products">محصولات</option>
                    <option value="category">دسته‌بندی خاص</option>
                  </select>
                </div>
                {sec.type === 'category' && (
                  <div>
                    <label className="text-xs text-gray-500">دسته‌بندی</label>
                    <select className="w-full rounded-lg border px-3 py-1.5 text-sm mt-1" value={sec.categoryId || ''}
                      onChange={(e) => updateSection(i, 'categoryId', Number(e.target.value))}>
                      <option value="">انتخاب کنید</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500">مرتب‌سازی</label>
                  <select className="w-full rounded-lg border px-3 py-1.5 text-sm mt-1" value={sec.sort}
                    onChange={(e) => updateSection(i, 'sort', e.target.value)}>
                    <option value="newest">جدیدترین</option>
                    <option value="cheapest">ارزان‌ترین</option>
                    <option value="expensive">گران‌ترین</option>
                    <option value="popular">محبوب‌ترین</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">تعداد محصولات</label>
                  <input type="number" className="w-full rounded-lg border px-3 py-1.5 text-sm mt-1" value={sec.count}
                    onChange={(e) => updateSection(i, 'count', Number(e.target.value))} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm text-white hover:bg-indigo-700">
          {saved ? '✓ ذخیره شد' : 'ذخیره تنظیمات'}
        </button>
      </form>
    </div>
  );
}
