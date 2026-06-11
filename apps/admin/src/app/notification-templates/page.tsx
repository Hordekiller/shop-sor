"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Icon } from "@iconify/react";

interface Template {
  type: string;
  titleTemplate: string;
  messageTemplate: string | null;
  emailSubject: string | null;
  emailHtml: string | null;
  smsTemplate: string | null;
  channels: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const LABELS: Record<string, string> = {
  order_confirmed: "تأیید سفارش",
  order_paid: "پرداخت سفارش",
  order_status_change: "تغییر وضعیت سفارش",
  order_cancelled: "لغو سفارش",
  stock_alert: "هشدار موجودی",
};

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Template>>({});

  useEffect(() => {
    api
      .get<Template[]>("/notification-templates")
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (tpl: Template) => {
    setEditing(tpl.type);
    setEditForm({ ...tpl });
  };

  const save = async () => {
    if (!editing) return;
    try {
      await api.put(`/notification-templates/${editing}`, editForm);
      const updated = templates.map((t) =>
        t.type === editing ? { ...t, ...editForm } : t,
      );
      setTemplates(updated);
      setEditing(null);
    } catch (e) {
      alert("خطا در ذخیره");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl animate-pulse"
            style={{ background: "#e5e7eb" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Icon
          icon="tabler:template"
          className="w-6 h-6"
          style={{ color: "var(--v-primary)" }}
        />
        <h1 className="text-xl font-bold">قالب پیام‌ها</h1>
      </div>

      <p className="text-sm mb-6" style={{ color: "var(--v-text-secondary)" }}>
        متغیرهای قابل استفاده: {"{orderNumber}"}، {"{amount}"}، {"{userName}"}،{" "}
        {"{status}"}، {"{statusLabel}"}
      </p>

      <div className="space-y-4">
        {templates.map((tpl) => (
          <div key={tpl.type} className="v-card p-5">
            {editing === tpl.type ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">
                    {LABELS[tpl.type] || tpl.type}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={save}
                      className="v-btn v-btn-primary text-xs"
                    >
                      ذخیره
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="v-btn text-xs"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      عنوان (درون‌برنامه‌ای)
                    </label>
                    <input
                      value={editForm.titleTemplate || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          titleTemplate: e.target.value,
                        })
                      }
                      className="v-input text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      متن (درون‌برنامه‌ای)
                    </label>
                    <input
                      value={editForm.messageTemplate || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          messageTemplate: e.target.value,
                        })
                      }
                      className="v-input text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      موضوع ایمیل
                    </label>
                    <input
                      value={editForm.emailSubject || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          emailSubject: e.target.value,
                        })
                      }
                      className="v-input text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      کانال‌ها
                    </label>
                    <input
                      value={editForm.channels || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, channels: e.target.value })
                      }
                      className="v-input text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">
                    قالب HTML ایمیل
                  </label>
                  <textarea
                    value={editForm.emailHtml || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, emailHtml: e.target.value })
                    }
                    className="v-input text-sm w-full"
                    dir="ltr"
                    rows={5}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium">فعال:</label>
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? true}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isActive: e.target.checked })
                    }
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {LABELS[tpl.type] || tpl.type}
                    </span>
                    {!tpl.isActive && (
                      <span className="v-badge v-badge-error text-[10px]">
                        غیرفعال
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => startEdit(tpl)}
                    className="text-xs"
                    style={{ color: "var(--v-primary)" }}
                  >
                    ویرایش
                  </button>
                </div>
                <div
                  className="text-xs space-y-1"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  <p>
                    عنوان:{" "}
                    <span dir="ltr" className="font-mono">
                      {tpl.titleTemplate}
                    </span>
                  </p>
                  {tpl.messageTemplate && (
                    <p>
                      متن:{" "}
                      <span dir="ltr" className="font-mono">
                        {tpl.messageTemplate}
                      </span>
                    </p>
                  )}
                  <p>کانال: {tpl.channels}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
