"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Menu {
  id: number;
  name: string;
  location: string;
  isActive: boolean;
  _count: { items: number };
}

const locationLabels: Record<string, string> = {
  header: "هدر اصلی",
  footer_1: "فوتر - ستون ۱",
  footer_2: "فوتر - ستون ۲",
  footer_3: "فوتر - ستون ۳",
  mobile_drawer: "منوی موبایل",
  mega_menu: "مگا منو",
  bottom_nav: "نوار پایین",
};

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("header");

  const fetchMenus = () => {
    setLoading(true);
    api
      .get<Menu[]>("/menus")
      .then(setMenus)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post("/menus", { name: newName, location: newLocation });
      setShowNew(false);
      setNewName("");
      fetchMenus();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/menus/${id}`, { isActive: !isActive });
      fetchMenus();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این منو اطمینان دارید؟")) return;
    try {
      await api.delete(`/menus/${id}`);
      fetchMenus();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            مدیریت منوها
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            ایجاد و مدیریت منوهای فروشگاه
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="v-btn v-btn-primary"
        >
          <Icon icon="tabler:plus" className="w-4 h-4" /> ساخت منوی جدید
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-[var(--v-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : menus.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:menu-2"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هنوز هیچ منویی ساخته نشده است.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <div key={menu.id} className="v-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3
                    className="font-bold text-base"
                    style={{ color: "var(--v-text)" }}
                  >
                    {menu.name}
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {locationLabels[menu.location] || menu.location}
                  </p>
                </div>
                <span
                  className={`v-badge ${menu.isActive ? "v-badge-success" : "v-badge-secondary"}`}
                >
                  {menu.isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <p
                className="text-sm mb-3"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {menu._count.items} آیتم
              </p>
              <div className="flex gap-2">
                <a
                  href={`/menus/${menu.id}`}
                  className="v-btn v-btn-secondary v-btn-sm flex-1"
                >
                  <Icon icon="tabler:edit" className="w-3.5 h-3.5" /> ویرایش
                </a>
                <button
                  onClick={() => handleToggle(menu.id, menu.isActive)}
                  className="v-btn v-btn-sm"
                  style={{
                    color: menu.isActive
                      ? "var(--v-warning)"
                      : "var(--v-primary)",
                  }}
                >
                  <Icon
                    icon={menu.isActive ? "tabler:eye-off" : "tabler:eye"}
                    className="w-3.5 h-3.5"
                  />
                </button>
                <button
                  onClick={() => handleDelete(menu.id)}
                  className="v-btn v-btn-sm"
                  style={{ color: "var(--v-error)" }}
                >
                  <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowNew(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-xl p-6"
              style={{
                background: "var(--v-card)",
                border: "1px solid var(--v-border)",
              }}
            >
              <h3
                className="text-lg font-bold mb-4"
                style={{ color: "var(--v-text)" }}
              >
                ساخت منوی جدید
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    نام منو
                  </label>
                  <input
                    className="v-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثلاً: منوی اصلی"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    جایگاه
                  </label>
                  <select
                    className="v-select"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  >
                    {Object.entries(locationLabels).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreate}
                    className="v-btn v-btn-primary flex-1"
                  >
                    ایجاد
                  </button>
                  <button
                    onClick={() => setShowNew(false)}
                    className="v-btn v-btn-secondary flex-1"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
