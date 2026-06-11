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
  { value: 'from-[#ef4056] to-[#d8364a]', label: 'قرمز' },
  { value: 'from-[#19bfd3] to-[#1599a8]', label: 'فیروزه‌ای' },
  { value: 'from-[#f9a825] to-[#e8960c]', label: 'زرد' },
  { value: 'from-[#6b21a8] to-[#581c87]', label: 'بنفش' },
  { value: 'from-[#059669] to-[#047857]', label: 'سبز' },
  { value: 'from-[#2563eb] to-[#1d4ed8]', label: 'آبی' },
  { value: 'from-[#dc2626] to-[#b91c1c]', label: 'قرمز تیره' },
  { value: 'from-[#0891b2] to-[#0e7490]', label: 'آبی تیره' },
];

export default function SettingsPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<'general' | 'slides' | 'sections'>('general');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    site_name: 'اطلس شاپ', site_description: '', support_email: '',
    support_phone: '', default_shipping: 'post_pishtaz', currency: 'تومان',
  });

  const [slides, setSlides] = useState<Slide[]>([]);
  const [editSlide, setEditSlide] = useState<Slide>({
    title: '', description: '', bgColor: gradients[0].value, image: '', link: '', sortOrder: 0, isActive: true,
  });
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      addToast('خطا در بارگذاری: ' + err.message, 'error');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveGeneral = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      addToast('تنظیمات ذخیره شد', 'success');
    } catch (err: any) { addToast('خطا: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('atlas_token');
      const res = await fetch('http://localhost:8000/api/v1/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Upload failed');
      return (await res.json()).url;
    } finally { setUploading(false); }
  };

  const openNewSlide = () => {
    setEditSlide({
      title: '', description: '', bgColor: gradients[0].value,
      image: '', link: '', sortOrder: slides.length, isActive: true,
    });
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
      addToast('خطا در ذخیره: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm('حذف شود؟')) return;
    try {
      await api.delete(`/slides/${id}`);
      setSlides(slides.filter((s) => s.id !== id));
    } catch (err: any) { addToast('خطا در حذف: ' + err.message, 'error'); }
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
    } catch (err: any) { addToast('خطا: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--dk-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">تنظیمات فروشگاه</h2>
        <button type="button" onClick={fetchData} className="text-xs text-indigo-600 hover:underline">🔄 بروزرسانی</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 pb-3">
        {[
          { id: 'general', label: '⚙️ عمومی' },
          { id: 'slides', label: '🎠 اسلایدرها' },
          { id: 'sections', label: '📦 سکشن‌ها' },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              tab === t.id ? 'bg-[var(--dk-primary)] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== GENERAL ===== */}
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

      {/* ===== SLIDES ===== */}
      {tab === 'slides' && (
        <div className="space-y-4">
          {/* Always-visible header with add button */}
          <div className="bg-white rounded-xl p-4 border shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎠</span>
              <div>
                <p className="text-sm font-medium">مدیریت اسلایدرها</p>
                <p className="text-xs text-gray-500">{slides.length} اسلاید</p>
              </div>
            </div>
            <button type="button" onClick={openNewSlide}
              className="rounded-lg bg-[var(--dk-primary)] text-white px-5 py-2.5 text-sm font-medium hover:brightness-110 transition flex items-center gap-1.5 shadow-sm">
              <span className="text-lg leading-none">+</span>
              اسلاید جدید
            </button>
          </div>

          {/* Modal */}
          {showSlideForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowSlideForm(false)}>
              <div className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()} dir="rtl">

                <div className="flex items-center justify-between pb-3 border-b">
                  <h3 className="font-bold text-base">{editSlide.id ? '✏️ ویرایش اسلاید' : '➕ اسلاید جدید'}</h3>
                  <button type="button" onClick={() => setShowSlideForm(false)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition text-lg">
                    &times;
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">عنوان اسلاید <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    value={editSlide.title}
                    onChange={(e) => setEditSlide({ ...editSlide, title: e.target.value })}
                    placeholder="مثال: فروش ویژه بهاره" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">توضیحات</label>
                  <input type="text" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    value={editSlide.description}
                    onChange={(e) => setEditSlide({ ...editSlide, description: e.target.value })}
                    placeholder="مثال: تخفیف تا ۵۰٪ روی هزاران محصول" />
                </div>

                {/* Link */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">لینک</label>
                  <input type="text" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    value={editSlide.link}
                    onChange={(e) => setEditSlide({ ...editSlide, link: e.target.value })}
                    placeholder="مثال: /products یا /category/1" />
                </div>

                {/* Sort + Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">ترتیب نمایش</label>
                    <input type="number" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      value={editSlide.sortOrder}
                      onChange={(e) => setEditSlide({ ...editSlide, sortOrder: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">وضعیت</label>
                    <label className="flex items-center gap-3 mt-2 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" checked={editSlide.isActive}
                          onChange={(e) => setEditSlide({ ...editSlide, isActive: e.target.checked })}
                          className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-500 transition after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                      </div>
                      <span className="text-sm">{editSlide.isActive ? 'فعال' : 'غیرفعال'}</span>
                    </label>
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">رنگ پس‌زمینه</label>
                  <div className="flex flex-wrap gap-2">
                    {gradients.map((g) => (
                      <button key={g.value} type="button"
                        onClick={() => setEditSlide({ ...editSlide, bgColor: g.value })}
                        title={g.label}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g.value} transition ${
                          editSlide.bgColor === g.value
                            ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110'
                            : 'hover:scale-105'
                        }`} />
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    تصویر اسلاید
                    <span className="text-[10px] text-gray-400 mr-2">
                      (پیشنهاد: دسکتاپ ۱۳۳۶×۴۰۰ ~ موبایل ۶۴۰×۳۰۰)
                    </span>
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition">
                    {!editSlide.image ? (
                      <>
                        <input type="file" accept="image/*" id="slide-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await handleUploadImage(file);
                              setEditSlide({ ...editSlide, image: url });
                              addToast('✅ تصویر با موفقیت آپلود شد', 'success');
                            } catch (err: any) {
                              addToast('خطا در آپلود: ' + err.message, 'error');
                            }
                          }}
                          className="hidden" />
                        <label htmlFor="slide-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <span className="text-3xl text-gray-300">📁</span>
                          <span className="text-sm text-gray-500">برای آپلود تصویر کلیک کنید</span>
                          <span className="text-[10px] text-gray-400">فرمت‌های مجاز: JPG, PNG, WebP</span>
                        </label>
                      </>
                    ) : (
                      <div className="relative">
                        <img src={`http://localhost:8000${editSlide.image}`} alt=""
                          className="w-full h-40 object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition rounded-lg flex items-center justify-center">
                          <div className="opacity-0 hover:opacity-100 transition flex gap-2">
                            <label htmlFor="slide-upload-replace" className="cursor-pointer bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                              تغییر
                            </label>
                            <input type="file" accept="image/*" id="slide-upload-replace"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const url = await handleUploadImage(file);
                                  setEditSlide({ ...editSlide, image: url });
                                } catch (err: any) { addToast('خطا: ' + err.message, 'error'); }
                              }}
                              className="hidden" />
                            <button type="button" onClick={() => setEditSlide({ ...editSlide, image: '' })}
                              className="bg-red-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {uploading && (
                      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-indigo-500">
                        <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        در حال آپلود...
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">پیش‌نمایش</label>
                  <div className={`h-40 rounded-xl bg-gradient-to-br ${editSlide.bgColor} flex items-center px-8 relative overflow-hidden`}>
                    {editSlide.image && (
                      <img src={`http://localhost:8000${editSlide.image}`} alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-30" />
                    )}
                    <div className="relative z-10 text-white">
                      <p className="text-lg font-bold">{editSlide.title || 'عنوان اسلاید'}</p>
                      <p className="text-sm text-white/80 mt-1">{editSlide.description || 'توضیحات اسلاید در اینجا نمایش داده می‌شود'}</p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button type="button" onClick={handleSaveSlide} disabled={saving}
                  className="w-full rounded-xl bg-indigo-600 text-white py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : editSlide.id ? '✏️ بروزرسانی اسلاید' : '➕ ایجاد اسلاید'}
                </button>
              </div>
            </div>
          )}

          {/* Slides list */}
          {slides.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed">
              <div className="text-6xl mb-4">🎠</div>
              <p className="font-medium text-gray-600">هنوز اسلایدی اضافه نکرده‌اید</p>
              <p className="text-xs text-gray-400 mt-1">روی دکمه "اسلاید جدید" کلیک کنید</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {slides.map((slide) => (
                <div key={slide.id} className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition flex items-center gap-4">
                  {/* Preview thumbnail */}
                  <div className={`w-36 h-24 rounded-xl bg-gradient-to-br ${slide.bgColor} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                    {slide.image && (
                      <img src={`http://localhost:8000${slide.image}`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                    )}
                    <span className="text-white text-lg font-bold relative z-10">{slide.title?.[0] || 'S'}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">{slide.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${
                        slide.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-200'
                      }`}>
                        {slide.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{slide.description || 'بدون توضیحات'}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                      <span>ترتیب: {slide.sortOrder}</span>
                      {slide.link && <span>🔗 {slide.link}</span>}
                      {slide.image && <span>📷 دارد</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => openEditSlide(slide)}
                      className="px-3.5 py-2 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition flex items-center gap-1">
                      ✏️ ویرایش
                    </button>
                    <button type="button" onClick={() => slide.id && handleDeleteSlide(slide.id)}
                      className="px-3.5 py-2 text-xs rounded-lg border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition flex items-center gap-1">
                      🗑 حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== SECTIONS ===== */}
      {tab === 'sections' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-white rounded-xl p-4 border shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-sm font-medium">سکشن‌های صفحه اصلی</p>
                <p className="text-xs text-gray-500">{sections.length} سکشن</p>
              </div>
            </div>
            <button type="button" onClick={addSection}
              className="rounded-lg bg-[var(--dk-primary)] text-white px-5 py-2.5 text-sm font-medium hover:brightness-110 transition flex items-center gap-1.5 shadow-sm">
              <span className="text-lg leading-none">+</span>
              سکشن جدید
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed">
              <div className="text-6xl mb-4">📦</div>
              <p className="font-medium text-gray-600">سکشنی تعریف نشده</p>
              <p className="text-xs text-gray-400 mt-1">سکشن‌ها بخش‌های مختلف صفحه اصلی را مشخص می‌کنند</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((sec, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">سکشن {i + 1}</span>
                    <button type="button" onClick={() => removeSection(i)}
                      className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition">🗑 حذف</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500">عنوان سکشن</label>
                      <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm mt-1" value={sec.title}
                        onChange={(e) => updateSection(i, 'title', e.target.value)}
                        placeholder="مثال: جدیدترین محصولات" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">نوع نمایش</label>
                      <select className="w-full rounded-lg border px-3 py-2 text-sm mt-1" value={sec.type}
                        onChange={(e) => updateSection(i, 'type', e.target.value)}>
                        <option value="products">محصولات جدید</option>
                        <option value="category">محصولات یک دسته</option>
                      </select>
                    </div>
                    {sec.type === 'category' && (
                      <div>
                        <label className="text-xs text-gray-500">انتخاب دسته</label>
                        <select className="w-full rounded-lg border px-3 py-2 text-sm mt-1" value={sec.categoryId || ''}
                          onChange={(e) => updateSection(i, 'categoryId', Number(e.target.value))}>
                          <option value="">انتخاب کنید</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500">مرتب‌سازی</label>
                      <select className="w-full rounded-lg border px-3 py-2 text-sm mt-1" value={sec.sort}
                        onChange={(e) => updateSection(i, 'sort', e.target.value)}>
                        <option value="newest">جدیدترین</option>
                        <option value="cheapest">ارزان‌ترین</option>
                        <option value="expensive">گران‌ترین</option>
                        <option value="popular">محبوب‌ترین</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">تعداد محصولات</label>
                      <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm mt-1" value={sec.count}
                        onChange={(e) => updateSection(i, 'count', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sections.length > 0 && (
            <button type="button" onClick={handleSaveSections} disabled={saving}
              className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50 transition">
              {saving ? 'در حال ذخیره...' : '💾 ذخیره سکشن‌ها'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
