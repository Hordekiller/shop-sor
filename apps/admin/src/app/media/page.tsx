"use client";

import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";

interface MediaItem {
  id: number;
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  width: number | null;
  height: number | null;
  format: string | null;
  sourceType: string;
  uploadedBy: string;
  uploadedById: number | null;
  attachedTo: string | null;
  alt: string | null;
  caption: string | null;
  isApproved: boolean;
  createdAt: string;
}

type ViewMode = "grid" | "list";
type SourceFilter = "" | "admin" | "product" | "blog" | "user_review";
type TypeFilter = "" | "image" | "video" | "file";
type StatusFilter = "" | "approved" | "pending";

const SOURCE_LABELS: Record<string, string> = {
  admin: "ادمین",
  product: "محصول",
  blog: "وبلاگ",
  user_review: "دیدگاه کاربر",
};
const SOURCE_COLORS: Record<string, string> = {
  admin: "#7367F0",
  product: "#28C76F",
  blog: "#FF9F43",
  user_review: "#FF4C51",
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function MediaPage() {
  const [view, setView] = useState<ViewMode>("grid");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      if (sourceFilter) params.set("sourceType", sourceFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("isApproved", statusFilter);
      if (search) params.set("search", search);

      const res = await api.get<{
        data: MediaItem[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/upload?${params}`);
      setItems(res.data);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia(1);
  }, []);

  useEffect(() => {
    fetchMedia(1);
  }, [sourceFilter, typeFilter, statusFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("atlas_token");
      const res = await fetch(
        `http://localhost:8000/api/v1/upload?sourceType=admin`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      if (res.ok) {
        fetchMedia(1);
      } else {
        const err = await res.json();
        alert(err.message || "Upload failed");
      }
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این فایل اطمینان دارید؟")) return;
    try {
      await api.delete(`/upload/${id}`);
      if (selected?.id === id) setSelected(null);
      fetchMedia();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const handleApprove = async (id: number, approve: boolean) => {
    try {
      await api.put(`/upload/${id}`, { isApproved: approve });
      fetchMedia();
      if (selected?.id === id) {
        setSelected({ ...selected, isApproved: approve });
      }
    } catch {
      alert("Error updating status");
    }
  };

  const handleUpdateMeta = async (id: number, alt: string, caption: string) => {
    try {
      await api.put(`/upload/${id}`, { alt, caption });
      if (selected?.id === id) {
        setSelected({ ...selected, alt, caption });
      }
    } catch {
      alert("Error updating metadata");
    }
  };

  const isImage = (m: MediaItem) => m.mimetype.startsWith("image/");
  const isVideo = (m: MediaItem) => m.mimetype.startsWith("video/");

  return (
    <div className="animate-fade-in max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            کتابخانه رسانه
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            {total} فایل
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="v-btn v-btn-primary"
          >
            <Icon
              icon={uploading ? "tabler:loader-2" : "tabler:upload"}
              className={`w-4 h-4 ${uploading ? "animate-spin" : ""}`}
            />
            {uploading ? "در حال آپلود..." : "آپلود فایل"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept="image/*,video/mp4,.pdf"
          />

          <div
            className="flex rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--v-border)" }}
          >
            <button
              onClick={() => setView("grid")}
              className={`p-2 ${view === "grid" ? "bg-gray-100" : ""}`}
              style={{
                color:
                  view === "grid"
                    ? "var(--v-primary)"
                    : "var(--v-text-secondary)",
              }}
            >
              <Icon icon="tabler:layout-grid" className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-gray-100" : ""}`}
              style={{
                color:
                  view === "list"
                    ? "var(--v-primary)"
                    : "var(--v-text-secondary)",
              }}
            >
              <Icon icon="tabler:list" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="v-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            className="v-input w-full"
            placeholder="جستجوی نام فایل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchMedia(1)}
          />
        </div>

        <select
          className="v-select w-36"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
        >
          <option value="">همه منابع</option>
          <option value="admin">ادمین</option>
          <option value="product">محصول</option>
          <option value="blog">وبلاگ</option>
          <option value="user_review">دیدگاه کاربر</option>
        </select>

        <select
          className="v-select w-32"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="">همه انواع</option>
          <option value="image">تصویر</option>
          <option value="video">ویدیو</option>
          <option value="file">فایل</option>
        </select>

        <select
          className="v-select w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="approved">تأیید شده</option>
          <option value="pending">در انتظار تأیید</option>
        </select>

        <button onClick={() => fetchMedia(1)} className="v-btn v-btn-primary">
          <Icon icon="tabler:search" className="w-4 h-4" />
          جستجو
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Main content */}
        <div>
          {loading ? (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                  : "space-y-2"
              }
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl animate-pulse"
                  style={{
                    background: "#e5e7eb",
                    height: view === "grid" ? 160 : 60,
                  }}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div
              className="text-center py-16 rounded-xl border"
              style={{ borderColor: "var(--v-border)" }}
            >
              <Icon
                icon="tabler:photo-off"
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: "var(--v-text-disabled)" }}
              />
              <p style={{ color: "var(--v-text-secondary)" }}>
                هیچ فایلی یافت نشد.
              </p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`rounded-xl border bg-white overflow-hidden cursor-pointer transition hover:shadow-md ${selected?.id === item.id ? "ring-2" : ""}`}
                  style={{
                    borderColor:
                      selected?.id === item.id
                        ? "var(--v-primary)"
                        : "var(--v-border)",
                  }}
                >
                  <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center relative">
                    {isImage(item) ? (
                      <img
                        src={mediaUrl(item.url)}
                        alt={item.alt || item.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : isVideo(item) ? (
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          icon="tabler:video"
                          className="w-10 h-10"
                          style={{ color: "var(--v-text-disabled)" }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: "var(--v-text-disabled)" }}
                        >
                          ویدیو
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          icon="tabler:file"
                          className="w-10 h-10"
                          style={{ color: "var(--v-text-disabled)" }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: "var(--v-text-disabled)" }}
                        >
                          {item.format?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {!item.isApproved && (
                      <span
                        className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                        style={{ background: "#FF4C51" }}
                      >
                        در انتظار
                      </span>
                    )}
                    <span
                      className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                      style={{
                        background: SOURCE_COLORS[item.sourceType] || "#64748B",
                      }}
                    >
                      {SOURCE_LABELS[item.sourceType] || item.sourceType}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-xs truncate font-medium">
                      {item.originalName}
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--v-text-disabled)" }}
                    >
                      {formatSize(item.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="v-card overflow-hidden">
              <table className="v-table">
                <thead>
                  <tr>
                    <th>پیش‌نمایش</th>
                    <th>نام فایل</th>
                    <th>نوع</th>
                    <th>حجم</th>
                    <th>منبع</th>
                    <th>وضعیت</th>
                    <th>آپلودکننده</th>
                    <th>تاریخ</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(item)}
                    >
                      <td>
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                          {isImage(item) ? (
                            <img
                              src={mediaUrl(item.url)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon
                              icon={
                                isVideo(item) ? "tabler:video" : "tabler:file"
                              }
                              className="w-5 h-5"
                              style={{ color: "var(--v-text-disabled)" }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="text-sm max-w-[200px] truncate">
                        {item.originalName}
                      </td>
                      <td
                        className="text-xs"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        {item.format?.toUpperCase() || "—"}
                      </td>
                      <td
                        className="text-xs"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        {formatSize(item.size)}
                      </td>
                      <td>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                          style={{
                            background:
                              SOURCE_COLORS[item.sourceType] || "#64748B",
                          }}
                        >
                          {SOURCE_LABELS[item.sourceType] || item.sourceType}
                        </span>
                      </td>
                      <td>
                        {item.isApproved ? (
                          <span
                            className="text-xs"
                            style={{ color: "#28C76F" }}
                          >
                            تأیید شده
                          </span>
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "#FF4C51" }}
                          >
                            در انتظار
                          </span>
                        )}
                      </td>
                      <td
                        className="text-xs"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        {item.uploadedBy}
                      </td>
                      <td
                        className="text-xs"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="p-1 rounded hover:bg-red-50"
                          style={{ color: "#ef4444" }}
                        >
                          <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => fetchMedia(page - 1)}
                className="v-btn v-btn-sm v-btn-secondary"
              >
                قبلی
              </button>
              <span
                className="text-sm px-3 py-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {page} از {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchMedia(page + 1)}
                className="v-btn v-btn-sm v-btn-secondary"
              >
                بعدی
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {selected ? (
            <div className="v-card p-5 space-y-4 sticky top-4">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-sm">جزئیات فایل</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Icon icon="tabler:x" className="w-4 h-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="rounded-xl bg-gray-50 aspect-[4/3] flex items-center justify-center overflow-hidden">
                {isImage(selected) ? (
                  <img
                    src={mediaUrl(selected.url)}
                    alt={selected.alt || selected.originalName}
                    className="w-full h-full object-contain"
                  />
                ) : isVideo(selected) ? (
                  <video
                    src={mediaUrl(selected.url)}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Icon
                    icon="tabler:file-text"
                    className="w-16 h-16"
                    style={{ color: "var(--v-text-disabled)" }}
                  />
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <DetailRow label="نام فایل" value={selected.originalName} />
                <DetailRow label="نام ذخیره‌شده" value={selected.filename} />
                <DetailRow label="نوع" value={selected.mimetype} />
                <DetailRow label="حجم" value={formatSize(selected.size)} />
                {selected.width && (
                  <DetailRow
                    label="ابعاد"
                    value={`${selected.width} × ${selected.height} px`}
                  />
                )}
                <DetailRow
                  label="منبع"
                  value={
                    SOURCE_LABELS[selected.sourceType] || selected.sourceType
                  }
                />
                <DetailRow label="آپلودکننده" value={selected.uploadedBy} />
                <DetailRow
                  label="وضعیت"
                  value={selected.isApproved ? "تأیید شده" : "در انتظار تأیید"}
                />
                <DetailRow
                  label="اتصال به"
                  value={selected.attachedTo || "—"}
                />
              </div>

              {/* Metadata editing */}
              <div
                className="space-y-3 pt-2 border-t"
                style={{ borderColor: "var(--v-border)" }}
              >
                <div>
                  <label className="block text-xs font-medium mb-1">
                    متن جایگزین (Alt)
                  </label>
                  <input
                    type="text"
                    className="v-input text-sm"
                    defaultValue={selected.alt || ""}
                    id={`alt-${selected.id}`}
                    placeholder="متن جایگزین برای سئو"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    توضیحات
                  </label>
                  <input
                    type="text"
                    className="v-input text-sm"
                    defaultValue={selected.caption || ""}
                    id={`caption-${selected.id}`}
                    placeholder="توضیح کوتاه"
                  />
                </div>
                <button
                  onClick={() => {
                    const alt = (
                      document.getElementById(
                        `alt-${selected.id}`,
                      ) as HTMLInputElement
                    ).value;
                    const caption = (
                      document.getElementById(
                        `caption-${selected.id}`,
                      ) as HTMLInputElement
                    ).value;
                    handleUpdateMeta(selected.id, alt, caption);
                  }}
                  className="v-btn v-btn-sm v-btn-secondary w-full"
                >
                  <Icon icon="tabler:device-floppy" className="w-3.5 h-3.5" />
                  ذخیره متادیتا
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <a
                  href={mediaUrl(selected.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v-btn v-btn-secondary v-btn-sm flex-1 flex items-center justify-center gap-1"
                >
                  <Icon icon="tabler:download" className="w-3.5 h-3.5" />
                  دانلود
                </a>
                {selected.sourceType === "user_review" &&
                  (selected.isApproved ? (
                    <button
                      onClick={() => handleApprove(selected.id, false)}
                      className="v-btn v-btn-sm flex-1"
                      style={{ color: "#FF4C51", borderColor: "#FF4C51" }}
                    >
                      رد
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(selected.id, true)}
                      className="v-btn v-btn-sm flex-1"
                      style={{ color: "#28C76F", borderColor: "#28C76F" }}
                    >
                      تأیید
                    </button>
                  ))}
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="v-btn v-btn-sm flex-1"
                  style={{ color: "#ef4444", borderColor: "#ef4444" }}
                >
                  <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            </div>
          ) : (
            <div className="v-card p-8 text-center">
              <Icon
                icon="tabler:photo"
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: "var(--v-text-disabled)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--v-text-secondary)" }}
              >
                روی یک فایل کلیک کنید تا جزئیات آن نمایش داده شود.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0" style={{ color: "var(--v-text-secondary)" }}>
        {label}
      </span>
      <span className="text-left truncate" dir="ltr">
        {value}
      </span>
    </div>
  );
}
