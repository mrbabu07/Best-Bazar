export type ProductSizeOption = {
  key: string;
  nameEn: string;
  nameAr: string;
};

export type ProductSizeCategory = {
  slug?: string;
  nameEn?: string;
  nameAr?: string;
};

const oneSize: ProductSizeOption[] = [{ key: "one-size", nameEn: "One Size", nameAr: "One Size" }];

const sizePresets: Array<{
  keywords: string[];
  sizes: ProductSizeOption[];
}> = [
  {
    keywords: ["burka", "burqa", "abaya", "jilbab", "khimar", "kaftan", "modest"],
    sizes: ["50", "52", "54", "56", "58", "60", "62"].map((size) => ({
      key: `length-${size}`,
      nameEn: size,
      nameAr: size
    }))
  },
  {
    keywords: ["shoe", "footwear", "sneaker", "sandal", "boot"],
    sizes: ["EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46"].map(
      (size) => ({ key: size.toLowerCase().replace(/\s+/g, "-"), nameEn: size, nameAr: size })
    )
  },
  {
    keywords: ["fashion", "clothing", "apparel", "dress", "shirt", "t-shirt", "pants", "jeans"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size) => ({
      key: size.toLowerCase(),
      nameEn: size,
      nameAr: size
    }))
  },
  {
    keywords: ["kids", "baby", "child"],
    sizes: ["2Y", "3Y", "4Y", "5Y", "6Y", "8Y", "10Y", "12Y"].map((size) => ({
      key: size.toLowerCase(),
      nameEn: size,
      nameAr: size
    }))
  },
  {
    keywords: ["ring", "jewelry", "jewellery"],
    sizes: ["US 5", "US 6", "US 7", "US 8", "US 9", "US 10", "US 11", "US 12"].map((size) => ({
      key: size.toLowerCase().replace(/\s+/g, "-"),
      nameEn: size,
      nameAr: size
    }))
  },
  {
    keywords: ["beauty", "perfume", "fragrance", "cosmetic"],
    sizes: ["30 ml", "50 ml", "75 ml", "100 ml", "150 ml"].map((size) => ({
      key: size.toLowerCase().replace(/\s+/g, "-"),
      nameEn: size,
      nameAr: size
    }))
  },
  {
    keywords: ["electronics", "home", "luxury", "watch", "bag", "accessory", "gift"],
    sizes: oneSize
  }
];

export function getCategorySizeOptions(category?: ProductSizeCategory | null): ProductSizeOption[] {
  const text = [category?.slug, category?.nameEn, category?.nameAr].filter(Boolean).join(" ").toLowerCase();
  const preset = sizePresets.find((item) => item.keywords.some((keyword) => text.includes(keyword)));

  return preset?.sizes ?? oneSize;
}

export function isSingleDefaultSize(sizes: ProductSizeOption[]) {
  return sizes.length === 1 && sizes[0]?.key === "one-size";
}
