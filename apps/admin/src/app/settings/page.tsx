'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface Slide {
  id?: number; title: string; description: string;
  bgColor: string; image: string; link: string;
  sortOrder: number; isActive: boolean;
}

interface Category { id: number; name: string }
interface Section { type: string; title: string; sort: string; count: number; categoryId?: number }

const gradients = [
  'from-[#ef4056] to-[#d8364a]', 'from-[#19bfd3] to-[#1599a8]',
  'from-[#f9a825] to-[#e8960c]', 'from-[#6b21a8] to-[#581c87]',
  'from-[#059669] to-[#047857]', 'from-[#2563eb] to-[#1d4ed8]',
  'from-[#dc2626] to-[#b91c1c]', 'from-[#0891b2] to-[#0e7490]',
];

const emptySlide: Slide = {
  title: '', description: '', bgColor: gradients[0],
  image: '', link: '', sortOrder: 0, isActive: true,
};

export default function SettingsPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<'general' | 'slides' | 'sections'>('general');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General settings
  const [form, setForm] = useState({
    site_name: 'اطلس شاپ', site_description: '', support_email: '',
    support_phone: '', default_shipping: 'post_pishtaz', currency: 'تومان',
  });

  // Slides
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editSlide, setEditSlide] = useState<Slide>({ ...emptySlide });
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sections
  const [sections, setSections] = useState<Section[]>([]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get<Record<string, string>>('/settings'),
      api.get<Slide[]>('/slides'),
      api.get<Category[]>('/categories'),
    ]).then(([settings, slidesData, cats]) => {
      setForm({
        site_name: settings.site_name || 'اطلس شاپ',
        site_description: settings.site_description || '',
        support_email: settings.support_email || '',
        support_phone: settings.support_phone || '',
        default_shipping: settings.default_shipping || 'post_pishtaz',
        currency: settings.currency || 'تومان',
      });
      setSlides(slidesData);
      setCategories(cats);
      if (settings.sections) {
        try { setSections(JSON.parse(settings.sections)); } catch {}
      }
    }).catch((err) => {
      console.error('Fetch error:', err);
      addToast('خطا در بارگذاری تنظیمات: ' + err.message, 'error');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveGeneral = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      addToast('تنظیمات ذخیره شد', 'success');
    } catch (err: any) {
      addToast('خطا در ذخیره: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('atlas_token');
      const res = await fetch('http://localhost:8000/api/v1/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err.message || 'Upload failed');
      }
      const data = await res.json();
      return data.url;
    } finally { setUploading(false); }
  };

  const openNewSlide = () => {
    setEditSlide({ ...emptySlide, sortOrder: slides.length });
    setShowSlideForm(true);
  };

  const openEditSlide = (s: Slide) => {
    setEditSlide({ ...s });
    setShowSlideForm(true);
  };

  const handleSaveSlide = async () => {
    if (!editSlide.title.trim()) {
      addToast('عنوان اسلاید الزامی است', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editSlide.id) {
        const updated = await api.put<Slide>(`/slides/${editSlide.id}`, editSlide);
        setSlides(slides.map((s) => s.id === editSlide.id ? updated : s));
        addToast('اسلاید بروزرسانی شد', 'success');
      } else {
        const created = await api.post<Slide>('/slides', editSlide);
        setSlides([...slides, created]);
        addToast('اسلاید ایجاد شد', 'success');
      }
      setShowSlideForm(false);
    } catch (err: any) {
      console.error('Slide save error:', err);
      addToast('خطا در ذخیره اسلاید: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm('حذف شود؟')) return;
    try {
      await api.delete(`/slides/${id}`);
      setSlides(slides.filter((s) => s.id !== id));
      addToast('اسلاید حذف شد', 'success');
    } catch (err: any) {
      addToast('خطا در حذف: ' + err.message, 'error');
    }
  };

  const addSection = () => setSections([...sections, { type: 'products', title: '', sort: 'newest', count: 12 }]);
  const removeSection = (i: number) => setSections(sections.filter((_, idx) => idx !== i));
  const updateSection = (i: number, field: string, value: any) => {
    const copy = [...sections]; (copy[i] as any)[field] = value; setSections(copy);
  };

  const handleSaveSections = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { sections: JSON.stringify(sections) });
      addToast('سکشن‌ها ذخیره شدند', 'success');
    } catch (err: any) {
      addToast('خطا در ذخیره: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-[var(--dk-primary)] border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">تنظیمات فروشگاه</h2>
        <button onClick={fetchData} className="text-xs text-indigo-600 hover:underline">بروزرسانی</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {[
          { id: 'general', label: 'عمومی' },
          { id: 'slides', label: 'اسلایدرها' },
          { id: 'sections', label: 'سکشن‌ها' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              tab === t.id ? 'bg-[var(--dk-primary)] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: General */}
      {tab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white rounded-xl p-6 shadow-sm border space-y-4 max-w-2xl">
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
          <button type="submit" disabled={saving}
            className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </form>
      )}

      {/* Tab: Slides */}
      {tab === 'slides' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{slides.length} اسلاید</p>
            <button onClick={openNewSlide} type="button"
              className="rounded-lg bg-[var(--dk-primary)] text-white px-4 py-2 text-sm hover:brightness-110 transition">
              + اسلاید جدید
            </button>
          </div>

          {/* Slide Modal */}
          {showSlideForm && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
              onClick={() => setShowSlideForm(false)}>
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4"
                onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{editSlide.id ? 'ویرایش اسلاید' : 'اسلاید جدید'}</h3>
                  <button type="button" onClick={() => setShowSlideForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">عنوان *</label>
                  <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm" value={editSlide.title}
                    onChange={(e) => setEditSlide({ ...editSlide, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">توضیحات</label>
                  <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm" value={editSlide.description}
                    onChange={(e) => setEditSlide({ ...editSlide, description: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">لینک</label>
                  <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm" value={editSlide.link}
                    onChange={(e) => setEditSlide({ ...editSlide, link: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">ترتیب</label>
                    <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm" value={editSlide.sortOrder}
                      onChange={(e) => setEditSlide({ ...editSlide, sortOrder: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">وضعیت</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input type="checkbox" checked={editSlide.isActive}
                        onChange={(e) => setEditSlide({ ...editSlide, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                      <span className="text-sm">فعال</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">رنگ پس‌زمینه</label>
                  <div className="flex flex-wrap gap-2">
                    {gradients.map((g) => (
                      <button key={g} type="button"
                        onClick={() => setEditSlide({ ...editSlide, bgColor: g })}
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g} ${
                          editSlide.bgColor === g ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                        }`} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">تصویر اسلاید</label>
                  <input type="file" accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await handleUploadImage(file);
                        setEditSlide({ ...editSlide, image: url });
                        addToast('تصویر آپلود شد', 'success');
                      } catch (err: any) {
                        addToast('خطا در آپلود تصویر: ' + err.message, 'error');
                      }
                    }}
                    className="w-full text-sm" />
                  {uploading && (
                    <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      در حال آپلود...
                    </p>
                  )}
                  {editSlide.image && (
                    <div className="mt-2 relative inline-block">
                      <img src={`http://localhost:8000${editSlide.image}`} alt="preview"
                        className="h-24 rounded-lg object-cover border" />
                      <button type="button" onClick={() => setEditSlide({ ...editSlide, image: '' })}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                        &times;
                      </button>
                    </div>
                  )}
                </div>
                <div className={`h-20 rounded-lg bg-gradient-to-br ${editSlide.bgColor} flex items-center px-6`}>
                  <div className="text-white">
                    <p className="text-base font-bold">{editSlide.title || 'عنوان اسلاید'}</p>
                    <p className="text-xs text-white/70 mt-0.5">{editSlide.description || 'توضیحات اسلاید'}</p>
                  </div>
                </div>
                <button type="button" onClick={handleSaveSlide} disabled={saving}
                  className="w-full rounded-lg bg-indigo-600 text-white py-2.5 text-sm hover:bg-indigo-700 disabled:opacity-50 transition">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      در حال ذخیره...
                    </span>
                  ) : 'ذخیره'}
                </button>
              </div>
            </div>
          )}

          {/* Slides List */}
          {slides.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
              <div className="text-5xl mb-4">🎠</div>
              <p className="font-medium">هیچ اسلایدی وجود ندارد</p>
              <p className="text-xs mt-1">برای شروع، اولین اسلاید را ایجاد کنید</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slides.map((slide) => (
                <div key={slide.id} className="bg-white rounded-xl p-4 border shadow-sm flex items-center gap-4 hover:shadow-md transition">
                  <div className={`w-28 h-20 rounded-lg bg-gradient-to-br ${slide.bgColor} flex items-center justify-center shrink-0 overflow-hidden`}>
                    {slide.image ? (
                      <img src={`http://localhost:8000${slide.image}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-bold">{slide.title?.[0] || 'S'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">{slide.title}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                        slide.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {slide.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{slide.description || 'بدون توضیحات'}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                      <span>ترتیب: {slide.sortOrder}</span>
                      {slide.link && <span>لینک: {slide.link}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => openEditSlide(slide)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                      ویرایش
                    </button>
                    <button type="button" onClick={() => slide.id && handleDeleteSlide(slide.id)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Sections */}
      {tab === 'sections' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{sections.length} سکشن</p>
            <button type="button" onClick={addSection}
              className="rounded-lg bg-[var(--dk-primary)] text-white px-4 py-2 text-sm hover:brightness-110 transition">
              + سکشن جدید
            </button>
          </div>
          <div className="space-y-3">
            {sections.map((sec, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">سکشن {i + 1}</span>
                  <button type="button" onClick={() => removeSection(i)} className="text-xs text-red-500 hover:underline">حذف</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">عنوان</label>
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
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                    <label className="text-xs text-gray-500">تعداد</label>
                    <input type="number" className="w-full rounded-lg border px-3 py-1.5 text-sm mt-1" value={sec.count}
                      onChange={(e) => updateSection(i, 'count', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {sections.length > 0 && (
            <button type="button" onClick={handleSaveSections} disabled={saving}
              className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره سکشن‌ها'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
