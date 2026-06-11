"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBriefcase,
  faMapMarkerAlt,
  faStar,
  faPlus,
  faPhone,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { provinces } from "@/lib/iran-provinces";

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  estimatedDays: string;
  basePrice: number;
  freeThreshold: number;
}

interface Address {
  id: number;
  title: string;
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  addressText: string;
  postalCode: string;
  isDefault: boolean;
}

const emptyAddressForm = {
  title: "خانه",
  receiverName: "",
  phone: "",
  province: "",
  city: "",
  addressText: "",
  postalCode: "",
  isDefault: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    id: number;
    orderNumber: string;
    total: number;
    paymentStatus: string;
    paymentUrl?: string;
  } | null>(null);

  const [paymentGateways, setPaymentGateways] = useState<
    { id: string; name: string; icon?: string }[]
  >([]);
  const [selectedGateway, setSelectedGateway] = useState("zarinpal");
  const [useWallet, setUseWallet] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressSaving, setAddressSaving] = useState(false);

  // Auth + profile gate
  const [authChecking, setAuthChecking] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [needsAddress, setNeedsAddress] = useState(false);
  const [phoneForm, setPhoneForm] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);

  const titleIcons: Record<string, any> = {
    خانه: faHome,
    "محل کار": faBriefcase,
    سایر: faMapMarkerAlt,
  };
  const titleColors: Record<string, string> = {
    خانه: "bg-blue-100 text-blue-600",
    "محل کار": "bg-purple-100 text-purple-600",
    سایر: "bg-gray-100 text-gray-600",
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    api
      .get<ShippingMethod[]>("/shipping/methods")
      .then(setShippingMethods)
      .catch(() => {});
    api
      .get<any>("/settings/public")
      .then((s) => setTaxRate(s.taxPercent || 0))
      .catch(() => {});
    api
      .get<{ id: string; name: string }[]>("/payments/gateways")
      .then((gateways) => {
        setPaymentGateways(gateways);
        if (gateways.length > 0) setSelectedGateway(gateways[0].id);
      })
      .catch(() => {});
    api
      .get<{ balance: number }>("/wallet")
      .then((w) => setWalletBalance(w.balance))
      .catch(() => {});
  }, []);

  // Auth + profile gate
  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      setAuthChecking(false);
      return;
    }
    api
      .get<any>("/auth/me")
      .then((u) => {
        setUserProfile(u);
        setNeedsPhone(!u.phone);
        setPhoneForm(u.phone || "");
        if (u.phone) {
          api
            .get<Address[]>("/addresses")
            .then((addrs) => {
              setAddresses(addrs);
              const def = addrs.find((a) => a.isDefault);
              if (def) setSelectedAddressId(def.id);
              setNeedsAddress(addrs.length === 0);
            })
            .catch(() => setNeedsAddress(true));
        } else {
          setNeedsAddress(false);
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, []);

  const totalWeight = items.reduce(
    (sum, item) => sum + ((item as any).weight || 0) * item.quantity,
    0,
  );

  useEffect(() => {
    if (selectedShipping) {
      api
        .post<{ totalCost: number }>("/shipping/calculate", {
          method: selectedShipping,
          subtotal,
          weight: totalWeight,
        })
        .then((r) => setShippingCost(r.totalCost))
        .catch(() => setShippingCost(0));
    }
  }, [selectedShipping, subtotal, totalWeight]);

  if (mounted && items.length === 0 && !orderResult) {
    router.push("/cart");
    return null;
  }

  const handleCoupon = async () => {
    if (!couponCode) return;
    try {
      const result = await api.get<{
        valid: boolean;
        discount: number;
        message?: string;
      }>(`/coupons/validate?code=${couponCode}&subtotal=${subtotal}`);
      if (result.valid) {
        setDiscount(result.discount);
        setCouponMsg(`تخفیف: ${result.discount.toLocaleString()} تومان`);
      } else {
        setDiscount(0);
        setCouponMsg("کد تخفیف معتبر نیست");
      }
    } catch {
      setCouponMsg("خطا در اعمال کد تخفیف");
    }
  };

  const total = subtotal + shippingCost + taxAmount - discount;

  const handleAddressFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    try {
      const created = await api.post<Address>("/addresses", addressForm);
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
      setAddressForm(emptyAddressForm);
      setNeedsAddress(false);
    } catch (err: any) {
      alert(err.message || "خطا");
    } finally {
      setAddressSaving(false);
    }
  };

  const selectedProvinceCities = addressForm.province
    ? provinces.find((p) => p.name === addressForm.province)?.cities || []
    : [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!agreedToTerms) {
      alert("لطفاً قوانین و مقررات را تأیید کنید");
      return;
    }
    setLoading(true);
    try {
      const order = await api.post<{
        id: number;
        orderNumber: string;
        total: number;
        paymentStatus: string;
      }>("/orders", {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        addressId: selectedAddressId,
        shippingMethod: selectedShipping || undefined,
        couponCode: couponCode || undefined,
        notes,
        paymentMethod: selectedGateway,
        useWallet,
        agreedToTerms,
      });

      if (order.paymentStatus === "paid") {
        setOrderResult({ ...order, paymentUrl: undefined });
        clearCart();
        return;
      }

      const payment = await api
        .post<{
          paymentUrl: string;
          authority: string;
        }>(`/payments/request/${order.id}`, { gateway: selectedGateway })
        .catch(() => null);
      if (payment?.paymentUrl && typeof window !== "undefined") {
        window.location.href = payment.paymentUrl;
      } else {
        setOrderResult({ ...order, paymentUrl: undefined });
      }
      clearCart();
    } catch (err: any) {
      alert(err.message || "خطا در ثبت سفارش");
    } finally {
      setLoading(false);
    }
  };

  if (orderResult) {
    return (
      <>
        <Header />
        <div className="dk-container py-16">
          <div className="max-w-md mx-auto text-center dk-card p-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">سفارش با موفقیت ثبت شد</h2>
            <p className="text-sm text-[var(--dk-text-light)] mb-2">
              شماره سفارش: {orderResult.orderNumber}
            </p>
            <p className="text-2xl font-bold text-[var(--dk-primary)] mb-6">
              {orderResult.total.toLocaleString()} تومان
            </p>
            {orderResult.paymentUrl && (
              <p className="text-sm text-[var(--dk-primary)] mb-4">
                <a href={orderResult.paymentUrl} className="underline">
                  پرداخت آنلاین
                </a>
              </p>
            )}
            <Link
              href="/products"
              className="dk-btn-primary inline-block text-sm"
            >
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!userProfile && !authChecking) {
    return (
      <>
        <Header />
        <div className="dk-container py-16">
          <div className="max-w-sm mx-auto text-center dk-card p-8">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="w-8 h-8 text-orange-500"
              />
            </div>
            <h2 className="text-xl font-bold mb-2">لطفاً وارد شوید</h2>
            <p className="text-sm text-[var(--dk-text-light)] mb-6">
              برای ادامه فرایند خرید باید وارد حساب کاربری خود شوید
            </p>
            <Link
              href="/auth/login"
              className="dk-btn-primary inline-block text-sm mb-3 w-full text-center"
            >
              ورود
            </Link>
            <Link
              href="/auth/register"
              className="block text-sm"
              style={{ color: "var(--dk-primary)" }}
            >
              ثبت‌نام
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (needsPhone && userProfile) {
    const savePhone = async () => {
      setPhoneSaving(true);
      try {
        await api.put("/auth/profile", { phone: phoneForm });
        setUserProfile({ ...userProfile, phone: phoneForm });
        setNeedsPhone(false);
        api
          .get<Address[]>("/addresses")
          .then((addrs) => {
            setAddresses(addrs);
            const def = addrs.find((a) => a.isDefault);
            if (def) setSelectedAddressId(def.id);
            setNeedsAddress(addrs.length === 0);
          })
          .catch(() => setNeedsAddress(true));
      } catch {
        alert("خطا در ذخیره شماره");
      } finally {
        setPhoneSaving(false);
      }
    };
    return (
      <>
        <Header />
        <div className="dk-container py-16">
          <div className="max-w-sm mx-auto dk-card p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="w-5 h-5 text-blue-500"
                />
              </div>
              <h2 className="text-lg font-bold mb-1">ثبت شماره موبایل</h2>
              <p className="text-sm text-[var(--dk-text-light)]">
                برای ادامه خرید شماره موبایل خود را وارد کنید
              </p>
            </div>
            <div className="space-y-4">
              <input
                type="tel"
                required
                value={phoneForm}
                onChange={(e) => setPhoneForm(e.target.value)}
                placeholder="شماره موبایل"
                className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
              />
              <button
                onClick={savePhone}
                disabled={phoneSaving || !phoneForm}
                className="w-full dk-btn-primary text-sm disabled:opacity-50"
              >
                {phoneSaving ? "در حال ذخیره..." : "تأیید شماره"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (needsAddress && userProfile && !needsPhone) {
    return (
      <>
        <Header />
        <div className="dk-container py-12">
          <div className="max-w-md mx-auto dk-card p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon
                  icon={faHome}
                  className="w-5 h-5 text-purple-500"
                />
              </div>
              <h2 className="text-lg font-bold mb-1">ثبت آدرس</h2>
              <p className="text-sm text-[var(--dk-text-light)]">
                برای ادامه خرید یک آدرس ثبت کنید
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">عنوان</label>
                <select
                  value={addressForm.title}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, title: e.target.value })
                  }
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                >
                  <option value="خانه">خانه</option>
                  <option value="محل کار">محل کار</option>
                  <option value="سایر">سایر</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    نام دریافت‌کننده
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.receiverName}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        receiverName: e.target.value,
                      })
                    }
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    شماره تماس
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, phone: e.target.value })
                    }
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    استان
                  </label>
                  <select
                    required
                    value={addressForm.province}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        province: e.target.value,
                        city: "",
                      })
                    }
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  >
                    <option value="">انتخاب استان</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">شهر</label>
                  <select
                    required
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    disabled={!addressForm.province}
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)] disabled:opacity-50"
                  >
                    <option value="">انتخاب شهر</option>
                    {selectedProvinceCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  کد پستی
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.postalCode}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      postalCode: e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">آدرس</label>
                <textarea
                  required
                  value={addressForm.addressText}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      addressText: e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  rows={2}
                />
              </div>
              <button
                type="button"
                onClick={handleAddressFormSubmit}
                disabled={addressSaving}
                className="w-full dk-btn-primary text-sm disabled:opacity-50"
              >
                {addressSaving ? "در حال ذخیره..." : "ذخیره آدرس"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <>
      <Header />
      {authChecking && (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{
              borderColor: "var(--dk-primary)",
              borderTopColor: "transparent",
            }}
          />
        </div>
      )}
      {!authChecking && (
        <div className="dk-container py-6">
          <nav className="text-xs text-[var(--dk-text-light)] mb-5">
            <Link href="/" className="hover:text-[var(--dk-primary)]">
              خانه
            </Link>
            <span className="mx-1.5">/</span>
            <Link href="/cart" className="hover:text-[var(--dk-primary)]">
              سبد خرید
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--dk-text)]">تسویه حساب</span>
          </nav>

          <h1 className="text-xl font-bold mb-6">تسویه حساب</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                {/* Address */}
                <div className="dk-card p-5">
                  <h3 className="font-bold text-sm mb-4">آدرس تحویل</h3>
                  {addresses.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {addresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                            selectedAddressId === addr.id
                              ? "border-[var(--dk-primary)] bg-[var(--dk-bg)]"
                              : "border-[var(--dk-border)] hover:bg-[var(--dk-bg)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={addr.id}
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="accent-[var(--dk-primary)] mt-0.5"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${titleColors[addr.title] || "bg-gray-100 text-gray-600"}`}
                              >
                                <FontAwesomeIcon
                                  icon={
                                    titleIcons[addr.title] || faMapMarkerAlt
                                  }
                                  className="w-3 h-3"
                                />
                                {addr.title}
                              </span>
                              {addr.isDefault && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--dk-primary)]">
                                  <FontAwesomeIcon
                                    icon={faStar}
                                    className="w-3 h-3"
                                  />
                                  پیش‌فرض
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium">
                              {addr.receiverName} | {addr.phone}
                            </p>
                            <p className="text-xs text-[var(--dk-text-light)] line-clamp-2">
                              {addr.province}، {addr.city} — {addr.addressText}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="flex items-center gap-1 text-sm text-[var(--dk-primary)] font-medium"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                    {showAddressForm ? "بستن فرم" : "افزودن آدرس جدید"}
                  </button>

                  {showAddressForm && (
                    <div className="mt-4 border-t border-[var(--dk-border)] pt-4">
                      <h4 className="text-sm font-medium mb-3">آدرس جدید</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            عنوان
                          </label>
                          <select
                            value={addressForm.title}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                title: e.target.value,
                              })
                            }
                            className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                          >
                            <option value="خانه">خانه</option>
                            <option value="محل کار">محل کار</option>
                            <option value="سایر">سایر</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block">
                              نام دریافت‌کننده
                            </label>
                            <input
                              type="text"
                              required
                              value={addressForm.receiverName}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  receiverName: e.target.value,
                                })
                              }
                              className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">
                              شماره تماس
                            </label>
                            <input
                              type="text"
                              required
                              value={addressForm.phone}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  phone: e.target.value,
                                })
                              }
                              className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block">
                              استان
                            </label>
                            <select
                              required
                              value={addressForm.province}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  province: e.target.value,
                                  city: "",
                                })
                              }
                              className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                            >
                              <option value="">انتخاب استان</option>
                              {provinces.map((p) => (
                                <option key={p.id} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">
                              شهر
                            </label>
                            <select
                              required
                              value={addressForm.city}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  city: e.target.value,
                                })
                              }
                              disabled={!addressForm.province}
                              className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)] disabled:opacity-50"
                            >
                              <option value="">انتخاب شهر</option>
                              {selectedProvinceCities.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            کد پستی
                          </label>
                          <input
                            type="text"
                            required
                            value={addressForm.postalCode}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                postalCode: e.target.value,
                              })
                            }
                            className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            آدرس
                          </label>
                          <textarea
                            required
                            value={addressForm.addressText}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                addressText: e.target.value,
                              })
                            }
                            className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                            rows={2}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddressFormSubmit}
                          disabled={addressSaving}
                          className="dk-btn-primary text-sm disabled:opacity-50"
                        >
                          {addressSaving ? "در حال ذخیره..." : "ذخیره آدرس"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping */}
                <div className="dk-card p-5">
                  <h3 className="font-bold text-sm mb-4">روش ارسال</h3>
                  <div className="space-y-3">
                    {shippingMethods.map((method) => {
                      const cost =
                        subtotal >= method.freeThreshold ? 0 : method.basePrice;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${
                            selectedShipping === method.id
                              ? "border-[var(--dk-primary)] bg-[var(--dk-bg)]"
                              : "border-[var(--dk-border)] hover:bg-[var(--dk-bg)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shipping"
                            value={method.id}
                            checked={selectedShipping === method.id}
                            onChange={(e) =>
                              setSelectedShipping(e.target.value)
                            }
                            className="accent-[var(--dk-primary)]"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {method.name}
                            </span>
                            <p className="text-xs text-[var(--dk-text-light)] mt-0.5">
                              {method.description}
                            </p>
                            {method.estimatedDays && (
                              <p className="text-xs text-[var(--dk-text-light)] mt-0.5">
                                تحویل: {method.estimatedDays}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-bold">
                            {cost === 0
                              ? "رایگان"
                              : `${cost.toLocaleString()} تومان`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Coupon */}
                <div className="dk-card p-5">
                  <h3 className="font-bold text-sm mb-3">کد تخفیف</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="کد تخفیف را وارد کنید"
                      className="flex-1 rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                    />
                    <button
                      type="button"
                      onClick={handleCoupon}
                      className="px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-[var(--dk-bg)]"
                    >
                      اعمال
                    </button>
                  </div>
                  {couponMsg && (
                    <p
                      className={`text-sm mt-2 ${discount > 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {couponMsg}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="dk-card p-5">
                  <h3 className="font-bold text-sm mb-3">توضیحات (اختیاری)</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="توضیحات خود را وارد کنید..."
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                    rows={3}
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <div className="dk-card p-5 space-y-4 sticky top-24">
                  <h3 className="font-bold text-sm">خلاصه سفارش</h3>

                  <div className="space-y-2 text-sm">
                    {items.map((item) => (
                      <div
                        key={`${item.productId}-${item.variantId || ""}`}
                        className="flex justify-between"
                      >
                        <div className="min-w-0">
                          <span className="text-[var(--dk-text-light)] line-clamp-1">
                            {item.title} × {item.quantity}
                          </span>
                          {item.variantName && (
                            <span className="text-[10px] text-[var(--dk-text-light)] block">
                              {item.variantName}
                            </span>
                          )}
                        </div>
                        <span className="font-medium shrink-0 mr-2">
                          {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[var(--dk-border)] pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--dk-text-light)]">
                        زیرمجموع
                      </span>
                      <span>{subtotal.toLocaleString()} تومان</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--dk-text-light)]">
                        حمل و نقل
                      </span>
                      <span>
                        {shippingCost === 0
                          ? "رایگان"
                          : `${shippingCost.toLocaleString()} تومان`}
                      </span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--dk-text-light)]">
                          مالیات بر ارزش افزوده
                        </span>
                        <span>{taxAmount.toLocaleString()} تومان</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>تخفیف</span>
                        <span>−{discount.toLocaleString()} تومان</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[var(--dk-border)] pt-3 flex items-center justify-between">
                    <span className="font-bold">مجموع</span>
                    <span
                      className="text-xl font-bold"
                      style={{ color: "var(--dk-primary)" }}
                    >
                      {total.toLocaleString()} تومان
                    </span>
                  </div>

                  {/* Payment method */}
                  <div className="border-t border-[var(--dk-border)] pt-3 space-y-2">
                    <h3 className="text-xs font-bold">روش پرداخت</h3>
                    <div className="space-y-2">
                      {paymentGateways.map((gw) => (
                        <label
                          key={gw.id}
                          className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition ${selectedGateway === gw.id ? "border-[var(--dk-primary)] bg-[var(--dk-bg)]" : "border-[var(--dk-border)]"}`}
                        >
                          <input
                            type="radio"
                            name="gateway"
                            value={gw.id}
                            checked={selectedGateway === gw.id}
                            onChange={() => setSelectedGateway(gw.id)}
                            className="accent-[var(--dk-primary)]"
                          />
                          <span className="text-xs">{gw.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Wallet */}
                  {walletBalance > 0 && (
                    <div className="border-t border-[var(--dk-border)] pt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useWallet}
                          onChange={(e) => setUseWallet(e.target.checked)}
                          className="accent-[var(--dk-primary)]"
                        />
                        <span className="text-xs">
                          استفاده از کیف پول ({walletBalance.toLocaleString()}{" "}
                          تومان)
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Agree to terms */}
                  <div className="border-t border-[var(--dk-border)] pt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="accent-[var(--dk-primary)]"
                        required
                      />
                      <span className="text-xs">
                        قوانین و مقررات را می‌پذیرم
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full dk-btn-primary text-center text-sm disabled:opacity-50"
                  >
                    {loading ? "در حال ثبت سفارش..." : "ثبت سفارش"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
