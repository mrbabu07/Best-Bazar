import type { Locale } from "@/lib/i18n";

const orderStatusLabels: Record<Locale, Record<string, string>> = {
  en: {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled"
  },
  ar: {
    PENDING: "قيد الانتظار",
    CONFIRMED: "مؤكد",
    PROCESSING: "قيد التجهيز",
    SHIPPED: "تم الشحن",
    DELIVERED: "تم التسليم",
    CANCELLED: "ملغي"
  }
};

const paymentStatusLabels: Record<Locale, Record<string, string>> = {
  en: {
    PENDING: "Pending",
    PAID: "Paid",
    FAILED: "Failed"
  },
  ar: {
    PENDING: "قيد الانتظار",
    PAID: "مدفوع",
    FAILED: "فشل الدفع"
  }
};

export function formatOrderStatus(status: string, locale: Locale) {
  return orderStatusLabels[locale][status] ?? status;
}

export function formatPaymentStatus(status: string, locale: Locale) {
  return paymentStatusLabels[locale][status] ?? status;
}
