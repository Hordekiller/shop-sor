"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

const tabs: TabItem[] = [
  { id: "general", label: "عمومی", icon: "tabler:building-store" },
  { id: "sales", label: "فروش", icon: "tabler:shopping-cart" },
  { id: "payment", label: "پرداخت", icon: "tabler:credit-card" },
  { id: "shipping", label: "ارسال", icon: "tabler:truck-delivery" },
  { id: "tax", label: "مالیات و فاکتور", icon: "tabler:file-invoice" },
  { id: "notifications", label: "پیامک و ایمیل", icon: "tabler:mail" },
  { id: "account", label: "حساب کاربری", icon: "tabler:user-circle" },
  { id: "colors", label: "رنگ‌بندی", icon: "tabler:palette" },
  { id: "advanced", label: "پیشرفته", icon: "tabler:settings" },
];

interface FormData {
  // General
  shopName: string;
  shopLogo: string;
  shopFavicon: string;
  shopDescription: string;
  siteName: string;
  siteDescription: string;
  currency: string;
  timezone: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  socialInstagram: string;
  socialTelegram: string;
  socialWhatsapp: string;
  maintenanceMode: string;
  maintenanceMessage: string;
  // Sales
  minOrderAmount: string;
  maxOrderAmount: string;
  stockWarningThreshold: string;
  cartHoldMinutes: string;
  allowBackorder: string;
  showOutOfStock: string;
  defaultUnit: string;
  // Payment
  zarinpalMerchant: string;
  cashOnDelivery: string;
  walletPayment: string;
  minCartForZarinpal: string;
  minCartForCOD: string;
  minCartForWallet: string;
  // Shipping
  defaultShipping: string;
  freeShippingThreshold: string;
  shippingMethods: string;
  shippingPostDelay: string;
  shippingExpressDelay: string;
  shippingPeykDelay: string;
  // Tax
  taxPercent: string;
  companyName: string;
  companyEconomicCode: string;
  companyRegistrationNumber: string;
  invoiceHeader: string;
  invoiceFooter: string;
  // SMS & Email
  smsProvider: string;
  smsApiKey: string;
  orderSmsTemplate: string;
  loginSmsTemplate: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  notifyOrderConfirm: string;
  notifyOrderShipped: string;
  notifyOrderDelivered: string;
  notifyLoginOtp: string;
  notifyWalletChange: string;
  // Account
  nationalIdRequired: string;
  otpLoginEnabled: string;
  autoApproveComments: string;
  passwordMinLength: string;
  passwordRequireSpecial: string;
  maxUploadSize: string;
  maxUploadCount: string;
  // Colors
  colorPrimary: string;
  colorSecondary: string;
  colorText: string;
  colorBg: string;
  colorMuted: string;
  colorSuccess: string;
  colorError: string;
  colorWarning: string;
  // Advanced
  robotsTxt: string;
  cacheEnabled: string;
}

const defaults: FormData = {
  shopName: "فروشگاه اطلس",
  shopLogo: "",
  shopFavicon: "",
  shopDescription: "",
  siteName: "اطلس شاپ",
  siteDescription: "فروشگاه اینترنتی اطلس شاپ",
  currency: "تومان",
  timezone: "Asia/Tehran",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  socialInstagram: "",
  socialTelegram: "",
  socialWhatsapp: "",
  maintenanceMode: "false",
  maintenanceMessage: "",
  minOrderAmount: "0",
  maxOrderAmount: "0",
  stockWarningThreshold: "10",
  cartHoldMinutes: "60",
  allowBackorder: "false",
  showOutOfStock: "true",
  defaultUnit: "عدد",
  zarinpalMerchant: "",
  cashOnDelivery: "true",
  walletPayment: "true",
  minCartForZarinpal: "0",
  minCartForCOD: "0",
  minCartForWallet: "0",
  defaultShipping: "post_pishtaz",
  freeShippingThreshold: "0",
  shippingMethods: "",
  shippingPostDelay: "3-5 روز",
  shippingExpressDelay: "1-2 روز",
  shippingPeykDelay: "2-4 ساعت",
  taxPercent: "0",
  companyName: "",
  companyEconomicCode: "",
  companyRegistrationNumber: "",
  invoiceHeader: "",
  invoiceFooter: "",
  smsProvider: "kavenegar",
  smsApiKey: "",
  orderSmsTemplate: "",
  loginSmsTemplate: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPass: "",
  notifyOrderConfirm: "true",
  notifyOrderShipped: "true",
  notifyOrderDelivered: "true",
  notifyLoginOtp: "true",
  notifyWalletChange: "true",
  nationalIdRequired: "false",
  otpLoginEnabled: "false",
  autoApproveComments: "false",
  passwordMinLength: "6",
  passwordRequireSpecial: "false",
  maxUploadSize: "2",
  maxUploadCount: "4",
  colorPrimary: "#ef4056",
  colorSecondary: "#19bfd3",
  colorText: "#3f3f3f",
  colorBg: "#f5f5f5",
  colorMuted: "#81858b",
  colorSuccess: "#28C76F",
  colorError: "#FF4C51",
  colorWarning: "#FF9F43",
  robotsTxt: "User-agent: *\nAllow: /\n",
  cacheEnabled: "true",
};

export default function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(defaults);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<"logo" | "favicon">("logo");
  const [mediaList, setMediaList] = useState<any[]>([]);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const [siteConfig, shopSettings] = await Promise.all([
        api.get<Record<string, string>>("/settings"),
        api.get<any>("/admin/settings"),
      ]);

      let colors: Record<string, string> = {};
      try {
        colors = JSON.parse(siteConfig.global_colors || "{}");
      } catch {}

      setForm({
        // General
        shopName: shopSettings.shopName || defaults.shopName,
        shopLogo: shopSettings.shopLogo || "",
        shopFavicon: shopSettings.shopFavicon || "",
        shopDescription: shopSettings.shopDescription || "",
        siteName: siteConfig.site_name || defaults.siteName,
        siteDescription:
          siteConfig.site_description || defaults.siteDescription,
        currency: siteConfig.currency || defaults.currency,
        timezone: siteConfig.timezone || defaults.timezone,
        contactPhone: shopSettings.contactPhone || "",
        contactEmail: shopSettings.contactEmail || "",
        contactAddress: shopSettings.contactAddress || "",
        socialInstagram: shopSettings.socialInstagram || "",
        socialTelegram: shopSettings.socialTelegram || "",
        socialWhatsapp: shopSettings.socialWhatsapp || "",
        maintenanceMode: siteConfig.maintenance_mode || "false",
        maintenanceMessage: siteConfig.maintenance_message || "",
        // Sales
        minOrderAmount: String(shopSettings.minOrderAmount ?? 0),
        maxOrderAmount: siteConfig.max_order_amount || "0",
        stockWarningThreshold: siteConfig.stock_warning_threshold || "10",
        cartHoldMinutes: siteConfig.cart_hold_minutes || "60",
        allowBackorder: siteConfig.allow_backorder || "false",
        showOutOfStock: siteConfig.show_out_of_stock || "true",
        defaultUnit: siteConfig.default_unit || defaults.defaultUnit,
        // Payment
        zarinpalMerchant: shopSettings.zarinpalMerchant || "",
        cashOnDelivery: siteConfig.cash_on_delivery || "true",
        walletPayment: siteConfig.wallet_payment || "true",
        minCartForZarinpal: siteConfig.min_cart_for_zarinpal || "0",
        minCartForCOD: siteConfig.min_cart_for_cod || "0",
        minCartForWallet: siteConfig.min_cart_for_wallet || "0",
        // Shipping
        defaultShipping: siteConfig.default_shipping || "post_pishtaz",
        freeShippingThreshold: siteConfig.free_shipping_threshold || "0",
        shippingMethods: siteConfig.shipping_methods || "",
        shippingPostDelay:
          siteConfig.shipping_post_delay || defaults.shippingPostDelay,
        shippingExpressDelay:
          siteConfig.shipping_express_delay || defaults.shippingExpressDelay,
        shippingPeykDelay:
          siteConfig.shipping_peyk_delay || defaults.shippingPeykDelay,
        // Tax
        taxPercent: String(shopSettings.taxPercent ?? 0),
        companyName: siteConfig.company_name || "",
        companyEconomicCode: siteConfig.company_economic_code || "",
        companyRegistrationNumber: siteConfig.company_registration_number || "",
        invoiceHeader: siteConfig.invoice_header || "",
        invoiceFooter: siteConfig.invoice_footer || "",
        // SMS & Email
        smsProvider: shopSettings.smsProvider || "kavenegar",
        smsApiKey: shopSettings.smsApiKey || "",
        orderSmsTemplate: shopSettings.orderSmsTemplate || "",
        loginSmsTemplate: siteConfig.login_sms_template || "",
        smtpHost: siteConfig.smtp_host || "",
        smtpPort: siteConfig.smtp_port || "587",
        smtpUser: siteConfig.smtp_user || "",
        smtpPass: siteConfig.smtp_pass || "",
        notifyOrderConfirm: siteConfig.notify_order_confirm || "true",
        notifyOrderShipped: siteConfig.notify_order_shipped || "true",
        notifyOrderDelivered: siteConfig.notify_order_delivered || "true",
        notifyLoginOtp: siteConfig.notify_login_otp || "true",
        notifyWalletChange: siteConfig.notify_wallet_change || "true",
        // Account
        nationalIdRequired: siteConfig.national_id_required || "false",
        otpLoginEnabled: siteConfig.otp_login_enabled || "false",
        autoApproveComments: siteConfig.auto_approve_comments || "false",
        passwordMinLength: siteConfig.password_min_length || "6",
        passwordRequireSpecial: siteConfig.password_require_special || "false",
        maxUploadSize: siteConfig.max_upload_size || "2",
        maxUploadCount: siteConfig.max_upload_count || "4",
        // Colors
        colorPrimary: colors.primary || defaults.colorPrimary,
        colorSecondary: colors.secondary || defaults.colorSecondary,
        colorText: colors.text || defaults.colorText,
        colorBg: colors.bg || defaults.colorBg,
        colorMuted: colors.muted || defaults.colorMuted,
        colorSuccess: colors.success || defaults.colorSuccess,
        colorError: colors.error || defaults.colorError,
        colorWarning: colors.warning || defaults.colorWarning,
        // Advanced
        robotsTxt: siteConfig.robots_txt || defaults.robotsTxt,
        cacheEnabled: siteConfig.cache_enabled || "true",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Open media modal
  const openMedia = (target: "logo" | "favicon") => {
    setMediaTarget(target);
    setMediaModalOpen(true);
    api.get<any[]>("/media").then(setMediaList).catch(console.error);
  };

  const selectMedia = (url: string) => {
    updateField(mediaTarget === "logo" ? "shopLogo" : "shopFavicon", url);
    setMediaModalOpen(false);
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const siteConfigData: Record<string, string> = {
        site_name: form.siteName,
        site_description: form.siteDescription,
        currency: form.currency,
        timezone: form.timezone,
        maintenance_mode: form.maintenanceMode,
        maintenance_message: form.maintenanceMessage,
        max_order_amount: form.maxOrderAmount,
        stock_warning_threshold: form.stockWarningThreshold,
        cart_hold_minutes: form.cartHoldMinutes,
        allow_backorder: form.allowBackorder,
        show_out_of_stock: form.showOutOfStock,
        default_unit: form.defaultUnit,
        cash_on_delivery: form.cashOnDelivery,
        wallet_payment: form.walletPayment,
        min_cart_for_zarinpal: form.minCartForZarinpal,
        min_cart_for_cod: form.minCartForCOD,
        min_cart_for_wallet: form.minCartForWallet,
        default_shipping: form.defaultShipping,
        free_shipping_threshold: form.freeShippingThreshold,
        shipping_methods: form.shippingMethods,
        shipping_post_delay: form.shippingPostDelay,
        shipping_express_delay: form.shippingExpressDelay,
        shipping_peyk_delay: form.shippingPeykDelay,
        company_name: form.companyName,
        company_economic_code: form.companyEconomicCode,
        company_registration_number: form.companyRegistrationNumber,
        invoice_header: form.invoiceHeader,
        invoice_footer: form.invoiceFooter,
        login_sms_template: form.loginSmsTemplate,
        smtp_host: form.smtpHost,
        smtp_port: form.smtpPort,
        smtp_user: form.smtpUser,
        smtp_pass: form.smtpPass,
        notify_order_confirm: form.notifyOrderConfirm,
        notify_order_shipped: form.notifyOrderShipped,
        notify_order_delivered: form.notifyOrderDelivered,
        notify_login_otp: form.notifyLoginOtp,
        notify_wallet_change: form.notifyWalletChange,
        national_id_required: form.nationalIdRequired,
        otp_login_enabled: form.otpLoginEnabled,
        auto_approve_comments: form.autoApproveComments,
        password_min_length: form.passwordMinLength,
        password_require_special: form.passwordRequireSpecial,
        max_upload_size: form.maxUploadSize,
        max_upload_count: form.maxUploadCount,
        robots_txt: form.robotsTxt,
        cache_enabled: form.cacheEnabled,
        global_colors: JSON.stringify({
          primary: form.colorPrimary,
          secondary: form.colorSecondary,
          text: form.colorText,
          bg: form.colorBg,
          muted: form.colorMuted,
          success: form.colorSuccess,
          error: form.colorError,
          warning: form.colorWarning,
        }),
      };

      await Promise.all([
        api.put("/settings", siteConfigData),
        api.put("/admin/settings", {
          shopName: form.shopName,
          shopLogo: form.shopLogo || undefined,
          shopFavicon: form.shopFavicon || undefined,
          shopDescription: form.shopDescription,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          contactAddress: form.contactAddress,
          socialInstagram: form.socialInstagram,
          socialTelegram: form.socialTelegram,
          socialWhatsapp: form.socialWhatsapp,
          minOrderAmount: Number(form.minOrderAmount),
          taxPercent: Number(form.taxPercent),
          zarinpalMerchant: form.zarinpalMerchant,
          smsProvider: form.smsProvider,
          smsApiKey: form.smsApiKey,
          orderSmsTemplate: form.orderSmsTemplate,
        }),
      ]);

      toast.addToast("تنظیمات با موفقیت ذخیره شد", "success");
    } catch (err: any) {
      toast.addToast(err.message || "خطا در ذخیره تنظیمات", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    label: string,
    field: keyof FormData,
    type: string = "text",
    options?: { value: string; label: string }[],
  ) => {
    const value = form[field];
    return (
      <div className="mb-4">
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--v-text)" }}
        >
          {label}
        </label>
        {type === "select" && options ? (
          <select
            className="v-select"
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            className="v-input min-h-[100px]"
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
          />
        ) : (
          <input
            type={type}
            className="v-input"
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--v-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            تنظیمات
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت تنظیمات فروشگاه
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="v-btn v-btn-primary"
        >
          <Icon
            icon={saving ? "tabler:loader-2" : "tabler:device-floppy"}
            className={`w-4 h-4 ${saving ? "animate-spin" : ""}`}
          />
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide"
        style={{ borderBottom: "1px solid var(--v-divider)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap rounded-t-lg transition-all"
            style={{
              color:
                activeTab === tab.id
                  ? "var(--v-primary)"
                  : "var(--v-text-secondary)",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid var(--v-primary)"
                  : "2px solid transparent",
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            <Icon icon={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="v-card p-6">
        {/* General */}
        {activeTab === "general" && (
          <div className="max-w-2xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              اطلاعات فروشگاه
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("نام فروشگاه", "shopName")}
              {renderField("نام سایت", "siteName")}
              {renderField("توضیحات فروشگاه", "shopDescription")}
              {renderField("توضیحات سایت", "siteDescription")}
              {renderField("واحد پول", "currency", "select", [
                { value: "تومان", label: "تومان" },
                { value: "ریال", label: "ریال" },
              ])}
              {renderField("منطقه زمانی", "timezone", "select", [
                { value: "Asia/Tehran", label: "تهران (UTC+3:30)" },
                { value: "Asia/Kabul", label: "کابل (UTC+4:30)" },
              ])}
              {renderField("تلفن تماس", "contactPhone")}
              {renderField("ایمیل", "contactEmail")}
              {renderField("آدرس", "contactAddress")}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  لوگوی فروشگاه
                </label>
                <div className="flex items-center gap-3">
                  {form.shopLogo && (
                    <img
                      src={form.shopLogo}
                      alt="logo"
                      className="w-16 h-16 rounded-lg object-cover"
                      style={{ border: "1px solid var(--v-border)" }}
                    />
                  )}
                  <button
                    onClick={() => openMedia("logo")}
                    className="v-btn v-btn-secondary v-btn-sm"
                  >
                    <Icon icon="tabler:photo" className="w-3.5 h-3.5" />
                    انتخاب تصویر
                  </button>
                  {form.shopLogo && (
                    <button
                      onClick={() => updateField("shopLogo", "")}
                      className="v-btn v-btn-sm"
                      style={{ color: "var(--v-error)" }}
                    >
                      <Icon icon="tabler:x" className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  فاوآیکون
                </label>
                <div className="flex items-center gap-3">
                  {form.shopFavicon && (
                    <img
                      src={form.shopFavicon}
                      alt="favicon"
                      className="w-10 h-10 rounded object-cover"
                      style={{ border: "1px solid var(--v-border)" }}
                    />
                  )}
                  <button
                    onClick={() => openMedia("favicon")}
                    className="v-btn v-btn-secondary v-btn-sm"
                  >
                    <Icon icon="tabler:photo" className="w-3.5 h-3.5" />
                    انتخاب تصویر
                  </button>
                  {form.shopFavicon && (
                    <button
                      onClick={() => updateField("shopFavicon", "")}
                      className="v-btn v-btn-sm"
                      style={{ color: "var(--v-error)" }}
                    >
                      <Icon icon="tabler:x" className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <h2
              className="text-lg font-bold mt-8 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              شبکه‌های اجتماعی
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("اینستاگرام", "socialInstagram")}
              {renderField("تلگرام", "socialTelegram")}
              {renderField("واتساپ", "socialWhatsapp")}
            </div>

            <h2
              className="text-lg font-bold mt-8 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              حالت تعمیرات
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("فعالسازی", "maintenanceMode", "select", [
                { value: "false", label: "غیرفعال" },
                { value: "true", label: "فعال" },
              ])}
              {renderField("پیام حالت تعمیرات", "maintenanceMessage")}
            </div>
          </div>
        )}

        {/* Sales */}
        {activeTab === "sales" && (
          <div className="max-w-2xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              تنظیمات فروش
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("حداقل مبلغ سفارش", "minOrderAmount", "number")}
              {renderField(
                "حداکثر مبلغ سفارش (0 = بدون محدودیت)",
                "maxOrderAmount",
                "number",
              )}
              {renderField(
                "آستانه هشدار کمبود موجودی",
                "stockWarningThreshold",
                "number",
              )}
              {renderField(
                "مدت نگهداری سبد خرید (دقیقه)",
                "cartHoldMinutes",
                "number",
              )}
              {renderField("مجاز به پیش‌خرید", "allowBackorder", "select", [
                { value: "false", label: "غیرفعال" },
                { value: "true", label: "فعال" },
              ])}
              {renderField(
                "نمایش محصولات ناموجود",
                "showOutOfStock",
                "select",
                [
                  { value: "true", label: "نمایش داده شود" },
                  { value: "false", label: "مخفی شود" },
                ],
              )}
              {renderField("واحد شمارش پیش‌فرض", "defaultUnit", "select", [
                { value: "عدد", label: "عدد" },
                { value: "کیلوگرم", label: "کیلوگرم" },
                { value: "متر", label: "متر" },
                { value: "لیتر", label: "لیتر" },
                { value: "بسته", label: "بسته" },
                { value: "جفت", label: "جفت" },
              ])}
            </div>
          </div>
        )}

        {/* Payment */}
        {activeTab === "payment" && (
          <div className="max-w-2xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              تنظیمات پرداخت
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("کد مرچنت زرین‌پال", "zarinpalMerchant")}
              {renderField("پرداخت در محل", "cashOnDelivery", "select", [
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
              ])}
              {renderField("پرداخت با کیف پول", "walletPayment", "select", [
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
              ])}
            </div>
            <h2
              className="text-lg font-bold mt-6 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              حداقل مبلغ برای هر روش
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField(
                "حداقل برای زرین‌پال",
                "minCartForZarinpal",
                "number",
              )}
              {renderField(
                "حداقل برای پرداخت در محل",
                "minCartForCOD",
                "number",
              )}
              {renderField("حداقل برای کیف پول", "minCartForWallet", "number")}
            </div>
            <p
              className="text-xs mt-4"
              style={{ color: "var(--v-text-secondary)" }}
            >
              کلیدهای درگاه به صورت رمزنگاری‌شده ذخیره می‌شوند.
            </p>
          </div>
        )}

        {/* Shipping */}
        {activeTab === "shipping" && (
          <div className="max-w-2xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              تنظیمات ارسال
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("روش پیش‌فرض ارسال", "defaultShipping", "select", [
                { value: "post_pishtaz", label: "پست پیشتاز" },
                { value: "post_express", label: "پست اکسپرس" },
                { value: "tipax", label: "تیپاکس" },
                { value: "peyk", label: "پیک" },
                { value: "bike", label: "پیک موتوری" },
              ])}
              {renderField(
                "سقف ارسال رایگان (0 = غیرفعال)",
                "freeShippingThreshold",
                "number",
              )}
            </div>
            <h2
              className="text-lg font-bold mt-6 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              زمان تقریبی ارسال
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("پست پیشتاز", "shippingPostDelay")}
              {renderField("پست اکسپرس", "shippingExpressDelay")}
              {renderField("پیک", "shippingPeykDelay")}
            </div>
            {renderField(
              "روش‌های ارسال (JSON پیشرفته)",
              "shippingMethods",
              "textarea",
            )}
            <p
              className="text-xs mt-2"
              style={{ color: "var(--v-text-secondary)" }}
            >
              می‌توانید هزینه‌های ارسال بر اساس استان و وزن را به صورت JSON وارد
              کنید.
            </p>
          </div>
        )}

        {/* Tax */}
        {activeTab === "tax" && (
          <div className="max-w-2xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              تنظیمات مالیاتی
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField(
                "درصد مالیات بر ارزش افزوده",
                "taxPercent",
                "number",
              )}
            </div>
            <h2
              className="text-lg font-bold mt-8 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              اطلاعات فاکتور رسمی
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("نام شرکت", "companyName")}
              {renderField("کد اقتصادی", "companyEconomicCode")}
              {renderField("شماره ثبت", "companyRegistrationNumber")}
            </div>
            <h2
              className="text-lg font-bold mt-6 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              قالب فاکتور
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {renderField("سربرگ فاکتور", "invoiceHeader", "textarea")}
              {renderField("پاورقی فاکتور", "invoiceFooter", "textarea")}
            </div>
          </div>
        )}

        {/* SMS & Email */}
        {activeTab === "notifications" && (
          <div className="max-w-2xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              تنظیمات پیامک
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("پنل پیامک", "smsProvider", "select", [
                { value: "kavenegar", label: "کاوه‌نگار" },
                { value: "ghasedak", label: "آتیه‌داران (قاصدک)" },
                { value: "farazsms", label: "فراز اس ام اس" },
              ])}
              {renderField("کلید API", "smsApiKey", "password")}
              {renderField("قالب پیامک سفارش", "orderSmsTemplate")}
              {renderField("قالب پیامک ورود (OTP)", "loginSmsTemplate")}
            </div>

            <h2
              className="text-lg font-bold mt-8 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              تنظیمات ایمیل (SMTP)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("هاست", "smtpHost")}
              {renderField("پورت", "smtpPort", "number")}
              {renderField("نام کاربری", "smtpUser")}
              {renderField("رمز عبور", "smtpPass", "password")}
            </div>

            <h2
              className="text-lg font-bold mt-6 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              اعلان‌ها
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("تأیید سفارش", "notifyOrderConfirm", "select", [
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
              ])}
              {renderField("ارسال سفارش", "notifyOrderShipped", "select", [
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
              ])}
              {renderField("تحویل سفارش", "notifyOrderDelivered", "select", [
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
              ])}
              {renderField("رمز یکبار مصرف (OTP)", "notifyLoginOtp", "select", [
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
              ])}
              {renderField("تغییر کیف پول", "notifyWalletChange", "select", [
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
              ])}
            </div>
          </div>
        )}

        {/* Account */}
        {activeTab === "account" && (
          <div className="max-w-2xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              تنظیمات حساب کاربری
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField(
                "الزامی بودن کد ملی",
                "nationalIdRequired",
                "select",
                [
                  { value: "false", label: "غیرفعال" },
                  { value: "true", label: "فعال" },
                ],
              )}
              {renderField("ورود با OTP", "otpLoginEnabled", "select", [
                { value: "false", label: "غیرفعال" },
                { value: "true", label: "فعال" },
              ])}
              {renderField(
                "تأیید خودکار نظرات",
                "autoApproveComments",
                "select",
                [
                  { value: "false", label: "غیرفعال (نیاز به تأیید ادمین)" },
                  { value: "true", label: "فعال (نمایش خودکار)" },
                ],
              )}
            </div>

            <h2
              className="text-lg font-bold mt-8 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              تنظیمات امنیت رمز عبور
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("حداقل طول رمز", "passwordMinLength", "number")}
              {renderField(
                "الزام به کاراکتر خاص",
                "passwordRequireSpecial",
                "select",
                [
                  { value: "false", label: "غیرفعال" },
                  { value: "true", label: "فعال" },
                ],
              )}
            </div>

            <h2
              className="text-lg font-bold mt-8 mb-4"
              style={{ color: "var(--v-text)" }}
            >
              محدودیت آپلود کاربران
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField(
                "حداکثر حجم فایل (مگابایت)",
                "maxUploadSize",
                "number",
              )}
              {renderField(
                "حداکثر تعداد فایل در هر نظر",
                "maxUploadCount",
                "number",
              )}
            </div>
          </div>
        )}

        {/* Colors */}
        {activeTab === "colors" && (
          <div className="max-w-2xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              پالت رنگ سراسری
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--v-text-secondary)" }}
            >
              این رنگ‌ها در سراسر فروشگاه و صفحه‌ساز استفاده می‌شوند. تغییر
              آن‌ها در تمام ویجت‌هایی که از رنگ سراسری استفاده می‌کنند اعمال
              می‌گردد.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  رنگ اصلی
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    value={form.colorPrimary}
                    onChange={(e) =>
                      updateField("colorPrimary", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="v-input flex-1"
                    value={form.colorPrimary}
                    onChange={(e) =>
                      updateField("colorPrimary", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  رنگ ثانویه
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    value={form.colorSecondary}
                    onChange={(e) =>
                      updateField("colorSecondary", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="v-input flex-1"
                    value={form.colorSecondary}
                    onChange={(e) =>
                      updateField("colorSecondary", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  رنگ متن
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    value={form.colorText}
                    onChange={(e) => updateField("colorText", e.target.value)}
                  />
                  <input
                    type="text"
                    className="v-input flex-1"
                    value={form.colorText}
                    onChange={(e) => updateField("colorText", e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  رنگ پس‌زمینه
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    value={form.colorBg}
                    onChange={(e) => updateField("colorBg", e.target.value)}
                  />
                  <input
                    type="text"
                    className="v-input flex-1"
                    value={form.colorBg}
                    onChange={(e) => updateField("colorBg", e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  رنگ کم‌رنگ
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    value={form.colorMuted}
                    onChange={(e) => updateField("colorMuted", e.target.value)}
                  />
                  <input
                    type="text"
                    className="v-input flex-1"
                    value={form.colorMuted}
                    onChange={(e) => updateField("colorMuted", e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  رنگ موفقیت
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    value={form.colorSuccess}
                    onChange={(e) =>
                      updateField("colorSuccess", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="v-input flex-1"
                    value={form.colorSuccess}
                    onChange={(e) =>
                      updateField("colorSuccess", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  رنگ خطا
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    value={form.colorError}
                    onChange={(e) => updateField("colorError", e.target.value)}
                  />
                  <input
                    type="text"
                    className="v-input flex-1"
                    value={form.colorError}
                    onChange={(e) => updateField("colorError", e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  رنگ هشدار
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    value={form.colorWarning}
                    onChange={(e) =>
                      updateField("colorWarning", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="v-input flex-1"
                    value={form.colorWarning}
                    onChange={(e) =>
                      updateField("colorWarning", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced */}
        {activeTab === "advanced" && (
          <div className="max-w-2xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              تنظیمات پیشرفته
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("فعال بودن کش", "cacheEnabled", "select", [
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
              ])}
            </div>
            <div className="mt-4">
              {renderField("robots.txt", "robotsTxt", "textarea")}
            </div>
            <div className="mt-8">
              <h3
                className="text-lg font-bold mb-4"
                style={{ color: "var(--v-text)" }}
              >
                ابزارها
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    localStorage.clear();
                    toast.addToast("کش مرورگر پاک شد", "success");
                  }}
                  className="v-btn v-btn-secondary"
                >
                  <Icon icon="tabler:trash" className="w-4 h-4" />
                  پاک‌سازی کش
                </button>
                <button
                  onClick={() => {
                    toast.addToast(
                      "لطفاً از دیتابیس در پنل مدیریت دیتابیس بکاپ بگیرید",
                      "info",
                    );
                  }}
                  className="v-btn v-btn-secondary"
                >
                  <Icon icon="tabler:database-export" className="w-4 h-4" />
                  پشتیبان‌گیری
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Modal */}
      {mediaModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMediaModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-2xl max-h-[80vh] rounded-xl p-6 overflow-y-auto"
              style={{
                background: "var(--v-card)",
                border: "1px solid var(--v-border)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg font-bold"
                  style={{ color: "var(--v-text)" }}
                >
                  انتخاب تصویر
                </h3>
                <button
                  onClick={() => setMediaModalOpen(false)}
                  className="v-btn v-btn-sm"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  <Icon icon="tabler:x" className="w-4 h-4" />
                </button>
              </div>
              {mediaList.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  هیچ فایلی یافت نشد. ابتدا در بخش رسانه فایل آپلود کنید.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {mediaList
                    .filter((m: any) => m.mimetype?.startsWith("image/"))
                    .map((file: any) => (
                      <button
                        key={file.id}
                        onClick={() => selectMedia(file.url)}
                        className="aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-[var(--v-primary)]"
                        style={{
                          borderColor:
                            form.shopLogo === file.url ||
                            form.shopFavicon === file.url
                              ? "var(--v-primary)"
                              : "var(--v-border)",
                        }}
                      >
                        <img
                          src={file.url}
                          alt={file.originalName}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
