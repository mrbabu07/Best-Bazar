import type { Category, Coupon, Order, Product, User } from "@/lib/types";

export const categories: Category[] = [
  {
    id: "cat-luxury",
    slug: "luxury",
    name: { en: "Luxury Gifts", ar: "هدايا فاخرة" },
    image: "https://images.unsplash.com/photo-1512163143273-bde0e3cc7407?auto=format&fit=crop&w=900&q=80",
    productCount: 26,
    isActive: true,
    sortOrder: 1
  },
  {
    id: "cat-fashion",
    slug: "fashion",
    name: { en: "Fashion", ar: "الأزياء" },
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    productCount: 44,
    isActive: true,
    sortOrder: 2
  },
  {
    id: "cat-electronics",
    slug: "electronics",
    name: { en: "Electronics", ar: "الإلكترونيات" },
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80",
    productCount: 31,
    isActive: true,
    sortOrder: 3
  },
  {
    id: "cat-home",
    slug: "home",
    name: { en: "Home Living", ar: "المنزل" },
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
    productCount: 38,
    isActive: true,
    sortOrder: 4
  },
  {
    id: "cat-beauty",
    slug: "beauty",
    name: { en: "Beauty", ar: "الجمال" },
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    productCount: 22,
    isActive: true,
    sortOrder: 5
  }
];

export const products: Product[] = [
  {
    id: "prd-watch-001",
    slug: "desert-gold-watch",
    name: { en: "Desert Gold Watch", ar: "ساعة ذهب الصحراء" },
    description: {
      en: "A refined stainless-steel watch with a brushed gold finish, sapphire glass, and premium gift packaging.",
      ar: "ساعة راقية من الستانلس ستيل بلمسة ذهبية وزجاج سفير وتغليف هدايا فاخر."
    },
    category: "luxury",
    subcategory: "watches",
    price: 1190,
    comparePrice: 1390,
    images: [
      {
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
        alt: "Gold luxury watch"
      },
      {
        url: "https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&w=1000&q=80",
        alt: "Premium watch closeup"
      }
    ],
    stock: 18,
    sku: "BB-DGW-001",
    brand: "Aurum Dubai",
    specifications: [
      { key: { en: "Material", ar: "الخامة" }, value: { en: "Stainless steel", ar: "ستانلس ستيل" } },
      { key: { en: "Warranty", ar: "الضمان" }, value: { en: "2 years", ar: "سنتان" } }
    ],
    tags: ["featured", "gift", "watch"],
    isActive: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 126,
    createdAt: "2026-05-19"
  },
  {
    id: "prd-oud-002",
    slug: "royal-oud-perfume",
    name: { en: "Royal Oud Perfume", ar: "عطر العود الملكي" },
    description: {
      en: "A rich oud fragrance with saffron, amber, and rose notes blended for elegant evening wear.",
      ar: "عطر عود غني بنفحات الزعفران والعنبر والورد لإطلالة مسائية أنيقة."
    },
    category: "beauty",
    subcategory: "fragrance",
    price: 420,
    comparePrice: 520,
    images: [
      {
        url: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1000&q=80",
        alt: "Luxury perfume bottle"
      },
      {
        url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1000&q=80",
        alt: "Perfume display"
      }
    ],
    stock: 9,
    sku: "BB-ROP-002",
    brand: "Majlis Scents",
    specifications: [
      { key: { en: "Volume", ar: "الحجم" }, value: { en: "75 ml", ar: "75 مل" } },
      { key: { en: "Concentration", ar: "التركيز" }, value: { en: "Eau de parfum", ar: "أو دو بارفان" } }
    ],
    tags: ["fragrance", "beauty", "sale"],
    isActive: true,
    isFeatured: true,
    rating: 4.7,
    reviewCount: 88,
    createdAt: "2026-05-27"
  },
  {
    id: "prd-audio-003",
    slug: "smart-travel-headphones",
    name: { en: "Smart Travel Headphones", ar: "سماعات السفر الذكية" },
    description: {
      en: "Noise-cancelling wireless headphones tuned for long flights, calls, and immersive music.",
      ar: "سماعات لاسلكية بعزل ضوضاء مناسبة للرحلات الطويلة والمكالمات والموسيقى."
    },
    category: "electronics",
    subcategory: "audio",
    price: 690,
    images: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
        alt: "Wireless headphones"
      },
      {
        url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80",
        alt: "Headphones product detail"
      }
    ],
    stock: 34,
    sku: "BB-STH-003",
    brand: "Nomad Tech",
    specifications: [
      { key: { en: "Battery", ar: "البطارية" }, value: { en: "42 hours", ar: "42 ساعة" } },
      { key: { en: "Connectivity", ar: "الاتصال" }, value: { en: "Bluetooth 5.3", ar: "بلوتوث 5.3" } }
    ],
    tags: ["electronics", "travel"],
    isActive: true,
    isFeatured: true,
    rating: 4.6,
    reviewCount: 203,
    createdAt: "2026-06-01"
  },
  {
    id: "prd-gift-004",
    slug: "saffron-dates-gift-box",
    name: { en: "Saffron Dates Gift Box", ar: "صندوق تمر بالزعفران" },
    description: {
      en: "Premium dates paired with saffron, nuts, and elegant packaging for business gifting.",
      ar: "تمر فاخر مع الزعفران والمكسرات وتغليف أنيق لهدايا الأعمال."
    },
    category: "luxury",
    subcategory: "gifting",
    price: 260,
    images: [
      {
        url: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1000&q=80",
        alt: "Luxury gift box"
      },
      {
        url: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=1000&q=80",
        alt: "Dates and nuts"
      }
    ],
    stock: 42,
    sku: "BB-SDG-004",
    brand: "Palm & Gold",
    specifications: [
      { key: { en: "Weight", ar: "الوزن" }, value: { en: "1.2 kg", ar: "1.2 كجم" } },
      { key: { en: "Packaging", ar: "التغليف" }, value: { en: "Gift-ready", ar: "جاهز للإهداء" } }
    ],
    tags: ["gift", "food", "new"],
    isActive: true,
    isFeatured: false,
    rating: 4.9,
    reviewCount: 64,
    createdAt: "2026-06-03"
  },
  {
    id: "prd-bag-005",
    slug: "leather-weekender-bag",
    name: { en: "Leather Weekender Bag", ar: "حقيبة سفر جلدية" },
    description: {
      en: "A structured leather weekender bag with smart compartments and cabin-friendly proportions.",
      ar: "حقيبة سفر جلدية بجيوب منظمة وحجم مناسب للمقصورة."
    },
    category: "fashion",
    subcategory: "bags",
    price: 880,
    comparePrice: 1040,
    images: [
      {
        url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1000&q=80",
        alt: "Leather travel bag"
      },
      {
        url: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1000&q=80",
        alt: "Fashion bag"
      }
    ],
    stock: 7,
    sku: "BB-LWB-005",
    brand: "Marina Atelier",
    specifications: [
      { key: { en: "Material", ar: "الخامة" }, value: { en: "Full-grain leather", ar: "جلد طبيعي" } },
      { key: { en: "Capacity", ar: "السعة" }, value: { en: "38 liters", ar: "38 لتر" } }
    ],
    tags: ["fashion", "travel", "sale"],
    isActive: true,
    isFeatured: true,
    rating: 4.5,
    reviewCount: 57,
    createdAt: "2026-05-23"
  },
  {
    id: "prd-home-006",
    slug: "skyline-tea-set",
    name: { en: "Skyline Tea Set", ar: "طقم شاي سكاي لاين" },
    description: {
      en: "Porcelain tea set with gold accents inspired by Dubai evenings and hospitality rituals.",
      ar: "طقم شاي بورسلان بلمسات ذهبية مستوحى من أمسيات دبي وكرم الضيافة."
    },
    category: "home",
    subcategory: "dining",
    price: 530,
    images: [
      {
        url: "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?auto=format&fit=crop&w=1000&q=80",
        alt: "Porcelain tea set"
      },
      {
        url: "https://images.unsplash.com/photo-1566706791215-2a1c3a4bbd8a?auto=format&fit=crop&w=1000&q=80",
        alt: "Elegant home tableware"
      }
    ],
    stock: 16,
    sku: "BB-STS-006",
    brand: "Creek Home",
    specifications: [
      { key: { en: "Pieces", ar: "القطع" }, value: { en: "12 pieces", ar: "12 قطعة" } },
      { key: { en: "Care", ar: "العناية" }, value: { en: "Hand wash", ar: "غسل يدوي" } }
    ],
    tags: ["home", "new"],
    isActive: true,
    isFeatured: false,
    rating: 4.4,
    reviewCount: 33,
    createdAt: "2026-06-04"
  },
  {
    id: "prd-prayer-007",
    slug: "premium-prayer-set",
    name: { en: "Premium Prayer Set", ar: "طقم صلاة فاخر" },
    description: {
      en: "Soft prayer mat, matching beads, and travel pouch made for refined everyday use.",
      ar: "سجادة صلاة ناعمة مع مسبحة وحقيبة سفر للاستخدام اليومي الراقي."
    },
    category: "home",
    subcategory: "lifestyle",
    price: 310,
    images: [
      {
        url: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1000&q=80",
        alt: "Prayer set"
      },
      {
        url: "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1000&q=80",
        alt: "Lifestyle textile"
      }
    ],
    stock: 24,
    sku: "BB-PPS-007",
    brand: "Noor Living",
    specifications: [
      { key: { en: "Fabric", ar: "القماش" }, value: { en: "Velvet blend", ar: "مزيج مخملي" } },
      { key: { en: "Included", ar: "المحتويات" }, value: { en: "Mat, beads, pouch", ar: "سجادة ومسبحة وحقيبة" } }
    ],
    tags: ["lifestyle", "gift"],
    isActive: true,
    isFeatured: false,
    rating: 4.9,
    reviewCount: 91,
    createdAt: "2026-05-31"
  },
  {
    id: "prd-jewelry-008",
    slug: "minimalist-gold-jewelry",
    name: { en: "Minimalist Gold Jewelry", ar: "مجوهرات ذهبية ناعمة" },
    description: {
      en: "A layered gold-plated jewelry set with clean lines for daily styling or gifting.",
      ar: "طقم مجوهرات مطلي بالذهب بتصميم ناعم للاستخدام اليومي أو الإهداء."
    },
    category: "fashion",
    subcategory: "jewelry",
    price: 740,
    comparePrice: 820,
    images: [
      {
        url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80",
        alt: "Gold jewelry set"
      },
      {
        url: "https://images.unsplash.com/photo-1603974372039-adc49044b6bd?auto=format&fit=crop&w=1000&q=80",
        alt: "Jewelry detail"
      }
    ],
    stock: 12,
    sku: "BB-MGJ-008",
    brand: "Dune Fine",
    specifications: [
      { key: { en: "Finish", ar: "التشطيب" }, value: { en: "18k gold plated", ar: "مطلي بذهب 18 قيراط" } },
      { key: { en: "Set", ar: "الطقم" }, value: { en: "Necklace and earrings", ar: "عقد وأقراط" } }
    ],
    tags: ["fashion", "jewelry", "new"],
    isActive: true,
    isFeatured: true,
    rating: 4.7,
    reviewCount: 112,
    createdAt: "2026-06-05"
  }
];

export const orders: Order[] = [
  {
    id: "ord-1001",
    orderNumber: "BB-1001",
    customer: { name: "Aisha Rahman", email: "aisha@example.com", phone: "+971 55 123 1122" },
    items: [
      {
        productId: "prd-oud-002",
        name: products[1].name,
        image: products[1].images[0].url,
        price: products[1].price,
        quantity: 2
      }
    ],
    shippingAddress: {
      street: "Business Bay, Tower 21",
      city: "Dubai",
      emirate: "Dubai",
      country: "UAE"
    },
    paymentMethod: "stripe",
    paymentStatus: "paid",
    orderStatus: "processing",
    subtotal: 840,
    shippingCost: 0,
    discount: 50,
    total: 790,
    currency: "AED",
    createdAt: "2026-06-08"
  },
  {
    id: "ord-1002",
    orderNumber: "BB-1002",
    customer: { name: "Omar Khan", email: "omar@example.com", phone: "+971 50 222 3344" },
    items: [
      {
        productId: "prd-watch-001",
        name: products[0].name,
        image: products[0].images[0].url,
        price: products[0].price,
        quantity: 1
      }
    ],
    shippingAddress: {
      street: "Dubai Marina, Silverene",
      city: "Dubai",
      emirate: "Dubai",
      country: "UAE"
    },
    paymentMethod: "cod",
    paymentStatus: "pending",
    orderStatus: "pending",
    subtotal: 1190,
    shippingCost: 20,
    discount: 0,
    total: 1210,
    currency: "USD",
    createdAt: "2026-06-07"
  },
  {
    id: "ord-1003",
    orderNumber: "BB-1003",
    customer: { name: "Nadia Karim", email: "nadia@example.com", phone: "+971 52 445 1988" },
    items: [
      {
        productId: "prd-bag-005",
        name: products[4].name,
        image: products[4].images[0].url,
        price: products[4].price,
        quantity: 1
      },
      {
        productId: "prd-gift-004",
        name: products[3].name,
        image: products[3].images[0].url,
        price: products[3].price,
        quantity: 1
      }
    ],
    shippingAddress: {
      street: "Jumeirah 3",
      city: "Dubai",
      emirate: "Dubai",
      country: "UAE"
    },
    paymentMethod: "stripe",
    paymentStatus: "paid",
    orderStatus: "delivered",
    subtotal: 1140,
    shippingCost: 0,
    discount: 70,
    total: 1070,
    currency: "BDT",
    createdAt: "2026-06-05"
  }
];

export const users: User[] = [
  {
    id: "usr-1",
    name: "Aisha Rahman",
    email: "aisha@example.com",
    role: "user",
    avatar: "AR",
    phone: "+971 55 123 1122",
    city: "Dubai",
    isBanned: false,
    orders: 8,
    createdAt: "2026-02-14"
  },
  {
    id: "usr-2",
    name: "Omar Khan",
    email: "omar@example.com",
    role: "admin",
    avatar: "OK",
    phone: "+971 50 222 3344",
    city: "Dubai",
    isBanned: false,
    orders: 3,
    createdAt: "2026-03-03"
  },
  {
    id: "usr-3",
    name: "Nadia Karim",
    email: "nadia@example.com",
    role: "user",
    avatar: "NK",
    phone: "+971 52 445 1988",
    city: "Sharjah",
    isBanned: false,
    orders: 12,
    createdAt: "2026-01-24"
  },
  {
    id: "usr-4",
    name: "Hassan Ali",
    email: "hassan@example.com",
    role: "user",
    avatar: "HA",
    phone: "+971 56 988 0011",
    city: "Dubai",
    isBanned: true,
    orders: 1,
    createdAt: "2026-04-18"
  }
];

export const coupons: Coupon[] = [
  {
    id: "cpn-dubai50",
    code: "DUBAI50",
    discountType: "fixed",
    discountValue: 50,
    minOrderAmount: 250,
    maxUses: 500,
    usedCount: 146,
    expiryDate: "2026-07-31",
    isActive: true
  },
  {
    id: "cpn-gold10",
    code: "GOLD10",
    discountType: "percent",
    discountValue: 10,
    minOrderAmount: 500,
    maxUses: 300,
    usedCount: 84,
    expiryDate: "2026-08-15",
    isActive: true
  },
  {
    id: "cpn-welcome",
    code: "WELCOME25",
    discountType: "fixed",
    discountValue: 25,
    minOrderAmount: 150,
    maxUses: 1000,
    usedCount: 1000,
    expiryDate: "2026-06-30",
    isActive: false
  }
];

export const adminStats = {
  revenue: {
    today: 6810,
    week: 39740,
    month: 128900
  },
  totalOrders: 342,
  pendingOrders: 18,
  deliveredOrders: 276,
  totalProducts: products.length,
  lowStockProducts: products.filter((product) => product.stock <= 10),
  revenueSeries: [
    2200, 2600, 2400, 3300, 4100, 3800, 4550, 5200, 4700, 6100, 5900, 6800
  ]
};

export const settings = {
  storeName: { en: "Best Bazar", ar: "بيست بازار" },
  contactInfo: {
    phone: "+971 4 555 0198",
    email: "support@bestbazar.ae",
    address: "Business Bay, Dubai"
  },
  shippingRates: [
    { emirate: "Dubai", price: 20, freeAbove: 250 },
    { emirate: "Abu Dhabi", price: 35, freeAbove: 450 },
    { emirate: "Sharjah", price: 25, freeAbove: 350 }
  ],
  banners: [
    {
      title: { en: "Dubai Gold Weekend", ar: "عطلة ذهب دبي" },
      link: "/shop?tag=sale",
      isActive: true
    }
  ]
};
