import type { Dictionary, Locale } from "@/lib/i18n";
import type { ThemeSettings } from "@/lib/theme-config";
import type { CurrencyRates } from "@/utils/currency";
import type { ShippingSettings } from "@/utils/shipping";

export type StorefrontFrameSettings = {
  storeNameEn: string;
  storeNameAr: string;
  announcementEn: string;
  announcementAr: string;
  announcementActive: boolean;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  currencyRates: CurrencyRates;
  shippingSettings: ShippingSettings;
  themeSettings: ThemeSettings;
};

export type StorefrontFrameProps = {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Dictionary;
  settings: StorefrontFrameSettings;
};
