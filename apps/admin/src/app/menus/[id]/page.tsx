"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Menu {
  id: number;
  name: string;
  location: string;
  isActive: boolean;
  items: MenuItem[];
}
interface MenuItem {
  id: number;
  parentId: number | null;
  title: string;
  linkType: string;
  linkValue: string;
  icon: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: MenuItem[];
}

const linkTypeLabels: Record<string, string> = {
  category: "دسته‌بندی",
  product: "محصول",
  brand: "برند",
  page: "صفحه",
  custom_url: "لینک دلخواه",
};

export default function MenuEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    title: "",
    linkType: "custom_url",
    linkValue: "",
    icon: "",
    image: "",
    parentId: "",
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<any>("/menus/" + id),
      api.get<any[]>("/categories"),
      api.get<any[]>("/brands"),
      api.get<any[]>("/pages/active"),
    ])
      .then(([m, cats, brds, pgs]) => {
        setMenu(m);
        setCategories(cats);
        setBrands(brds);
        setPages(pgs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const buildTree = (items: MenuItem[]): MenuItem[] => {
    const map = new Map<number, MenuItem>();
    const roots: MenuItem[] = [];
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    sorted.forEach((i) => map.set(i.id, { ...i, children: [] }));
    sorted.forEach((i) => {
      if (i.parentId && map.has(i.parentId))
        map.get(i.parentId)!.children!.push(map.get(i.id)!);
      else if (!i.parentId) roots.push(map.get(i.id)!);
    });
    return roots;
  };

  const fetchMenu = () => {
    api
      .get<any>("/menus/" + id)
      .then(setMenu)
      .catch(console.error);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/menus/${id}`, {
        name: menu?.name,
        isActive: menu?.isActive,
      });
      router.push("/menus");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm({
      title: "",
      linkType: "custom_url",
      linkValue: "",
      icon: "",
      image: "",
      parentId: "",
    });
    setShowItemForm(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      title: item.title,
      linkType: item.linkType,
      linkValue: item.linkValue,
      icon: item.icon || "",
      image: item.image || "",
      parentId: String(item.parentId || ""),
    });
    setShowItemForm(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.title.trim()) return alert("عنوان الزامی است");
    try {
      if (editingItem) {
        await api.put(`/menus/items/${editingItem.id}`, {
          ...itemForm,
          parentId: itemForm.parentId ? Number(itemForm.parentId) : null,
        });
      } else {
        await api.post(`/menus/${id}/items`, {
          ...itemForm,
          parentId: itemForm.parentId ? Number(itemForm.parentId) : null,
        });
      }
      setShowItemForm(false);
      fetchMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("آیا از حذف این آیتم اطمینان دارید؟")) return;
    try {
      await api.delete(`/menus/items/${itemId}`);
      fetchMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleItemActive = async (item: MenuItem) => {
    try {
      await api.put(`/menus/items/${item.id}`, { isActive: !item.isActive });
      fetchMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: number) => {
    e.dataTransfer.setData("text/plain", String(itemId));
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetId: number,
    asChild: boolean = false,
  ) => {
    e.preventDefault();
    setDragOver(null);
    const draggedId = Number(e.dataTransfer.getData("text/plain"));
    if (draggedId === targetId) return;
    try {
      const flatItems = menu?.items || [];
      const dragged = flatItems.find((i) => i.id === draggedId);
      if (!dragged) return;
      const newParentId = asChild
        ? targetId
        : flatItems.find((i) => i.id === targetId)?.parentId || null;
      const newSortOrder = flatItems.filter(
        (i) => i.parentId === newParentId,
      ).length;
      await api.put(`/menus/${id}/reorder`, {
        items: [
          { id: draggedId, parentId: newParentId, sortOrder: newSortOrder },
        ],
      });
      fetchMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const renderItem = (item: MenuItem, depth: number = 0) => (
    <div key={item.id} className="mb-1">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${dragOver === item.id ? "ring-2 ring-[var(--v-primary)]" : ""}`}
        style={{ background: "var(--v-bg)", marginRight: depth * 20 }}
        draggable
        onDragStart={(e) => handleDragStart(e, item.id)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(item.id);
        }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => handleDrop(e, item.id, false)}
      >
        <Icon
          icon="tabler:grip-vertical"
          className="w-4 h-4 shrink-0"
          style={{ color: "var(--v-text-disabled)", cursor: "grab" }}
        />
        {item.icon && <Icon icon={item.icon} className="w-4 h-4 shrink-0" />}
        {item.image && (
          <img
            src={item.image}
            alt=""
            className="w-6 h-6 rounded object-cover shrink-0"
          />
        )}
        <span className="flex-1 truncate font-medium">{item.title}</span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(115,103,240,0.1)",
            color: "var(--v-primary)",
          }}
        >
          {linkTypeLabels[item.linkType] || item.linkType}
        </span>
        <span
          className={`w-2 h-2 rounded-full ${item.isActive ? "bg-green-500" : "bg-gray-300"}`}
        />
        <button
          onClick={() => openEditItem(item)}
          className="p-1 rounded hover:bg-gray-200 transition"
        >
          <Icon
            icon="tabler:edit"
            className="w-3.5 h-3.5"
            style={{ color: "var(--v-text-secondary)" }}
          />
        </button>
        <button
          onClick={() => handleDeleteItem(item.id)}
          className="p-1 rounded hover:bg-gray-200 transition"
        >
          <Icon
            icon="tabler:trash"
            className="w-3.5 h-3.5"
            style={{ color: "var(--v-error)" }}
          />
        </button>
        <button
          onClick={() => handleToggleItemActive(item)}
          className="p-1 rounded hover:bg-gray-200 transition"
        >
          <Icon
            icon={item.isActive ? "tabler:eye-off" : "tabler:eye"}
            className="w-3.5 h-3.5"
            style={{ color: "var(--v-text-secondary)" }}
          />
        </button>
        <div className="relative group">
          <button className="p-1 rounded hover:bg-gray-200 transition">
            <Icon
              icon="tabler:indent-increase"
              className="w-3.5 h-3.5"
              style={{ color: "var(--v-text-secondary)" }}
            />
          </button>
          <div
            className="absolute top-full left-0 mt-1 w-32 z-20 rounded-lg py-1 shadow-lg hidden group-hover:block"
            style={{
              background: "var(--v-card)",
              border: "1px solid var(--v-border)",
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDrop(e as any, item.id, true);
              }}
              className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 transition"
            >
              قرار دادن به عنوان زیرمنو
            </button>
          </div>
        </div>
      </div>
      {item.children?.map((child) => renderItem(child, depth + 1))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--v-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!menu)
    return (
      <div className="v-card p-12 text-center">
        <p style={{ color: "var(--v-text-secondary)" }}>منو یافت نشد.</p>
      </div>
    );

  const tree = buildTree(menu.items || []);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/menus")}
          className="v-btn v-btn-secondary v-btn-sm"
        >
          <Icon icon="tabler:arrow-right" className="w-4 h-4" /> بازگشت
        </button>
        <div className="flex-1">
          <input
            className="v-input text-xl font-bold"
            value={menu.name}
            onChange={(e) => setMenu({ ...menu, name: e.target.value })}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              color: "var(--v-text)",
            }}
          />
          <p className="text-sm" style={{ color: "var(--v-text-secondary)" }}>
            {menu.location}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <span style={{ color: "var(--v-text-secondary)" }}>فعال</span>
          <input
            type="checkbox"
            className="v-checkbox"
            checked={menu.isActive}
            onChange={(e) => setMenu({ ...menu, isActive: e.target.checked })}
          />
        </label>
        <button
          onClick={handleSave}
          disabled={saving}
          className="v-btn v-btn-primary"
        >
          <Icon
            icon={saving ? "tabler:loader-2" : "tabler:device-floppy"}
            className={`w-4 h-4 ${saving ? "animate-spin" : ""}`}
          />
          ذخیره
        </button>
      </div>

      <div className="v-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ color: "var(--v-text)" }}>
            آیتم‌های منو
          </h2>
          <button
            onClick={openNewItem}
            className="v-btn v-btn-primary v-btn-sm"
          >
            <Icon icon="tabler:plus" className="w-3.5 h-3.5" /> افزودن آیتم
          </button>
        </div>
        <p
          className="text-xs mb-4"
          style={{ color: "var(--v-text-secondary)" }}
        >
          آیتم‌ها را با کشیدن مرتب کنید. برای زیرمنو کردن، روی آیکون تورفتگی
          کلیک کنید.
        </p>
        {tree.length === 0 ? (
          <div className="p-8 text-center">
            <Icon
              icon="tabler:list"
              className="w-10 h-10 mx-auto mb-2"
              style={{ color: "var(--v-text-disabled)" }}
            />
            <p style={{ color: "var(--v-text-secondary)" }}>
              هنوز هیچ آیتمی اضافه نشده است.
            </p>
          </div>
        ) : (
          <div>{tree.map((item) => renderItem(item))}</div>
        )}
      </div>

      {/* Item Form Modal */}
      {showItemForm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowItemForm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-lg rounded-xl p-6"
              style={{
                background: "var(--v-card)",
                border: "1px solid var(--v-border)",
              }}
            >
              <h3
                className="text-lg font-bold mb-4"
                style={{ color: "var(--v-text)" }}
              >
                {editingItem ? "ویرایش آیتم" : "آیتم جدید"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    عنوان
                  </label>
                  <input
                    className="v-input"
                    value={itemForm.title}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    نوع لینک
                  </label>
                  <select
                    className="v-select"
                    value={itemForm.linkType}
                    onChange={(e) => {
                      setItemForm({
                        ...itemForm,
                        linkType: e.target.value,
                        linkValue: "",
                      });
                    }}
                  >
                    {Object.entries(linkTypeLabels).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    مقصد
                  </label>
                  {itemForm.linkType === "category" ? (
                    <select
                      className="v-select"
                      value={itemForm.linkValue}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, linkValue: e.target.value })
                      }
                    >
                      <option value="">انتخاب دسته</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : itemForm.linkType === "brand" ? (
                    <select
                      className="v-select"
                      value={itemForm.linkValue}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, linkValue: e.target.value })
                      }
                    >
                      <option value="">انتخاب برند</option>
                      {brands.map((b: any) => (
                        <option key={b.id} value={String(b.id)}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : itemForm.linkType === "page" ? (
                    <select
                      className="v-select"
                      value={itemForm.linkValue}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, linkValue: e.target.value })
                      }
                    >
                      <option value="">انتخاب صفحه</option>
                      {pages.map((p: any) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="v-input"
                      value={itemForm.linkValue}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, linkValue: e.target.value })
                      }
                      placeholder="URL دلخواه مانند /products یا https://..."
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--v-text)" }}
                    >
                      آیکون (اختیاری)
                    </label>
                    <input
                      className="v-input"
                      value={itemForm.icon}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, icon: e.target.value })
                      }
                      placeholder="tabler:home"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--v-text)" }}
                    >
                      تصویر (اختیاری)
                    </label>
                    <input
                      className="v-input"
                      value={itemForm.image}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, image: e.target.value })
                      }
                      placeholder="URL تصویر"
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    والد (برای زیرمنو)
                  </label>
                  <select
                    className="v-select"
                    value={itemForm.parentId}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, parentId: e.target.value })
                    }
                  >
                    <option value="">بدون والد (ریشه)</option>
                    {(menu.items || [])
                      .filter((i) => !i.parentId)
                      .map((i: any) => (
                        <option key={i.id} value={String(i.id)}>
                          {i.title}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveItem}
                    className="v-btn v-btn-primary flex-1"
                  >
                    ذخیره
                  </button>
                  <button
                    onClick={() => setShowItemForm(false)}
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
