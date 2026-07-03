import type { Dictionary, Locale } from "@/lib/i18n";
import type { ThemeSettings } from "@/lib/theme-config";
import type { StorefrontContent } from "@/lib/theme-config";
import type { CurrencyRates } from "@/utils/currency";
import type { ShippingSettings } from "@/utils/shipping";

export type StorefrontFrameSettings = {
  storeNameEn: string;
  storeNameAr: string;
  logo: string;
  announcementEn: string;
  announcementAr: string;
  announcementActive: boolean;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  currencyRates: CurrencyRates;
  shippingSettings: ShippingSettings;
  themeSettings: ThemeSettings;
  storefrontContent: StorefrontContent;
  navigationCategories: Array<{
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    parentCategoryId?: string | null;
  }>;
};

export type StorefrontFrameProps = {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Dictionary;
  settings: StorefrontFrameSettings;
};
