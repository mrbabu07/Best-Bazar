export type ShopColorPreset = {
  key: string;
  nameEn: string;
  nameAr: string;
  colorHex: string;
};

export function normalizeColorKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const rawShopColorPalette: ShopColorPreset[] = [
  { key: "black", nameEn: "Black", nameAr: "Black", colorHex: "#111827" },
  { key: "white", nameEn: "White", nameAr: "White", colorHex: "#ffffff" },
  { key: "off white", nameEn: "Off White", nameAr: "Off White", colorHex: "#faf9f4" },
  { key: "ivory", nameEn: "Ivory", nameAr: "Ivory", colorHex: "#fff8e7" },
  { key: "cream", nameEn: "Cream", nameAr: "Cream", colorHex: "#f5f0df" },
  { key: "beige", nameEn: "Beige", nameAr: "Beige", colorHex: "#d6c4a3" },
  { key: "sand", nameEn: "Sand", nameAr: "Sand", colorHex: "#d8c7a3" },
  { key: "taupe", nameEn: "Taupe", nameAr: "Taupe", colorHex: "#8b8580" },
  { key: "nude", nameEn: "Nude", nameAr: "Nude", colorHex: "#e3bc9a" },
  { key: "gray", nameEn: "Gray", nameAr: "Gray", colorHex: "#9ca3af" },
  { key: "charcoal", nameEn: "Charcoal", nameAr: "Charcoal", colorHex: "#374151" },
  { key: "silver", nameEn: "Silver", nameAr: "Silver", colorHex: "#cbd5e1" },
  { key: "gold", nameEn: "Gold", nameAr: "Gold", colorHex: "#d4af37" },
  { key: "rose gold", nameEn: "Rose Gold", nameAr: "Rose Gold", colorHex: "#b76e79" },
  { key: "bronze", nameEn: "Bronze", nameAr: "Bronze", colorHex: "#8c5a2b" },
  { key: "copper", nameEn: "Copper", nameAr: "Copper", colorHex: "#b87333" },
  { key: "brown", nameEn: "Brown", nameAr: "Brown", colorHex: "#7c2d12" },
  { key: "tan", nameEn: "Tan", nameAr: "Tan", colorHex: "#c19a6b" },
  { key: "camel", nameEn: "Camel", nameAr: "Camel", colorHex: "#c68642" },
  { key: "khaki", nameEn: "Khaki", nameAr: "Khaki", colorHex: "#bdb76b" },
  { key: "coffee", nameEn: "Coffee", nameAr: "Coffee", colorHex: "#6f4e37" },
  { key: "chocolate", nameEn: "Chocolate", nameAr: "Chocolate", colorHex: "#4e2f21" },
  { key: "red", nameEn: "Red", nameAr: "Red", colorHex: "#dc2626" },
  { key: "maroon", nameEn: "Maroon", nameAr: "Maroon", colorHex: "#7f1d1d" },
  { key: "burgundy", nameEn: "Burgundy", nameAr: "Burgundy", colorHex: "#800020" },
  { key: "coral", nameEn: "Coral", nameAr: "Coral", colorHex: "#ff7f50" },
  { key: "peach", nameEn: "Peach", nameAr: "Peach", colorHex: "#fdb98b" },
  { key: "orange", nameEn: "Orange", nameAr: "Orange", colorHex: "#f97316" },
  { key: "amber", nameEn: "Amber", nameAr: "Amber", colorHex: "#b45309" },
  { key: "yellow", nameEn: "Yellow", nameAr: "Yellow", colorHex: "#facc15" },
  { key: "mustard", nameEn: "Mustard", nameAr: "Mustard", colorHex: "#d4a017" },
  { key: "lime", nameEn: "Lime", nameAr: "Lime", colorHex: "#84cc16" },
  { key: "green", nameEn: "Green", nameAr: "Green", colorHex: "#16a34a" },
  { key: "emerald", nameEn: "Emerald", nameAr: "Emerald", colorHex: "#059669" },
  { key: "forest green", nameEn: "Forest Green", nameAr: "Forest Green", colorHex: "#166534" },
  { key: "olive", nameEn: "Olive", nameAr: "Olive", colorHex: "#708238" },
  { key: "mint", nameEn: "Mint", nameAr: "Mint", colorHex: "#98f5c1" },
  { key: "teal", nameEn: "Teal", nameAr: "Teal", colorHex: "#0f766e" },
  { key: "turquoise", nameEn: "Turquoise", nameAr: "Turquoise", colorHex: "#2dd4bf" },
  { key: "aqua", nameEn: "Aqua", nameAr: "Aqua", colorHex: "#22d3ee" },
  { key: "sky blue", nameEn: "Sky Blue", nameAr: "Sky Blue", colorHex: "#38bdf8" },
  { key: "blue", nameEn: "Blue", nameAr: "Blue", colorHex: "#2563eb" },
  { key: "royal blue", nameEn: "Royal Blue", nameAr: "Royal Blue", colorHex: "#1d4ed8" },
  { key: "navy", nameEn: "Navy", nameAr: "Navy", colorHex: "#1e3a8a" },
  { key: "denim", nameEn: "Denim", nameAr: "Denim", colorHex: "#1560bd" },
  { key: "indigo", nameEn: "Indigo", nameAr: "Indigo", colorHex: "#4f46e5" },
  { key: "purple", nameEn: "Purple", nameAr: "Purple", colorHex: "#7c3aed" },
  { key: "plum", nameEn: "Plum", nameAr: "Plum", colorHex: "#673147" },
  { key: "lavender", nameEn: "Lavender", nameAr: "Lavender", colorHex: "#c4b5fd" },
  { key: "mauve", nameEn: "Mauve", nameAr: "Mauve", colorHex: "#b784a7" },
  { key: "magenta", nameEn: "Magenta", nameAr: "Magenta", colorHex: "#d946ef" },
  { key: "pink", nameEn: "Pink", nameAr: "Pink", colorHex: "#f472b6" },
  { key: "rose", nameEn: "Rose", nameAr: "Rose", colorHex: "#fb7185" },
  { key: "multi", nameEn: "Multi", nameAr: "Multi", colorHex: "#64748b" }
];

const arabicColorNames: Record<string, string> = {
  black: "أسود", white: "أبيض", "off white": "أوف وايت", ivory: "عاجي", cream: "كريمي",
  beige: "بيج", sand: "رملي", taupe: "رمادي داكن", nude: "نيود", gray: "رمادي",
  charcoal: "فحمي", silver: "فضي", gold: "ذهبي", "rose gold": "ذهبي وردي", bronze: "برونزي",
  copper: "نحاسي", brown: "بني", tan: "أسمر فاتح", camel: "جملي", khaki: "كاكي",
  coffee: "قهوة", chocolate: "شوكولاتة", red: "أحمر", maroon: "عنابي", burgundy: "بورغندي",
  coral: "مرجاني", peach: "خوخي", orange: "برتقالي", amber: "كهرماني", yellow: "أصفر",
  mustard: "خردلي", lime: "ليموني", green: "أخضر", emerald: "زمردي", "forest green": "أخضر غابي",
  olive: "زيتوني", mint: "نعناعي", teal: "أزرق مخضر", turquoise: "فيروزي", aqua: "مائي",
  "sky blue": "أزرق سماوي", blue: "أزرق", "royal blue": "أزرق ملكي", navy: "كحلي", denim: "دنيم",
  indigo: "نيلي", purple: "بنفسجي", plum: "برقوقي", lavender: "لافندر", mauve: "موف",
  magenta: "أرجواني", pink: "وردي", rose: "وردي داكن", multi: "متعدد الألوان"
};

export const shopColorPalette: ShopColorPreset[] = rawShopColorPalette.map((color) => ({
  ...color,
  nameAr: arabicColorNames[color.key] ?? color.nameAr
}));

export function getPresetColorHex(colorName: string) {
  const key = normalizeColorKey(colorName);
  return shopColorPalette.find((item) => item.key === key)?.colorHex;
}
