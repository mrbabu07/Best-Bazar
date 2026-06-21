const bcrypt = require("bcryptjs");
const { PrismaClient, DiscountType, PaymentMethod, PaymentStatus, OrderStatus, UserRole } = require("@prisma/client");

const prisma = new PrismaClient();

const categories = [
  {
    nameEn: "Luxury Gifts",
    nameAr: "هدايا فاخرة",
    slug: "luxury",
    image: "https://images.unsplash.com/photo-1512163143273-bde0e3cc7407?auto=format&fit=crop&w=900&q=80",
    sortOrder: 1
  },
  {
    nameEn: "Fashion",
    nameAr: "الأزياء",
    slug: "fashion",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    sortOrder: 2
  },
  {
    nameEn: "Abaya Collection",
    nameAr: "\u0645\u062c\u0645\u0648\u0639\u0629 \u0627\u0644\u0639\u0628\u0627\u064a\u0627\u062a",
    slug: "abaya-collection",
    image: "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=900&q=80",
    productType: "WOMENS_FASHION",
    customFields: [
      {
        id: "embroidery-style",
        labelEn: "Embroidery style",
        labelAr: "\u0646\u0645\u0637 \u0627\u0644\u062a\u0637\u0631\u064a\u0632",
        type: "TEXT",
        required: false
      }
    ],
    sortOrder: 3
  },
  {
    nameEn: "Electronics",
    nameAr: "الإلكترونيات",
    slug: "electronics",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80",
    sortOrder: 4
  },
  {
    nameEn: "Home Living",
    nameAr: "المنزل",
    slug: "home",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
    sortOrder: 5
  },
  {
    nameEn: "Beauty",
    nameAr: "الجمال",
    slug: "beauty",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    sortOrder: 6
  },
  {
    nameEn: "Niqab",
    nameAr: "\u0646\u0642\u0627\u0628",
    slug: "niqab",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80",
    productType: "WOMENS_FASHION",
    sortOrder: 7
  },
  {
    nameEn: "Prayer Dress & Set",
    nameAr: "\u0641\u0633\u0627\u062a\u064a\u0646 \u0648\u0623\u0637\u0642\u0645\u0629 \u0627\u0644\u0635\u0644\u0627\u0629",
    slug: "prayer-dress-set",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    productType: "WOMENS_FASHION",
    sortOrder: 8
  }
];

const products = [
  {
    slug: "desert-gold-watch",
    nameEn: "Desert Gold Watch",
    nameAr: "ساعة ذهب الصحراء",
    descriptionEn: "A refined stainless-steel watch with a brushed gold finish, sapphire glass, and premium gift packaging.",
    descriptionAr: "ساعة راقية من الستانلس ستيل بلمسة ذهبية وزجاج سفير وتغليف هدايا فاخر.",
    categorySlug: "luxury",
    price: "1190",
    comparePrice: "1390",
    stock: 28,
    sku: "BB-DGW-001",
    brand: "Aurum Dubai",
    isFeatured: true,
    rating: "4.8",
    reviewCount: 126,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80"
  },
  {
    slug: "royal-oud-perfume",
    nameEn: "Royal Oud Perfume",
    nameAr: "عطر العود الملكي",
    descriptionEn: "A rich oud fragrance with saffron, amber, and rose notes blended for elegant evening wear.",
    descriptionAr: "عطر عود غني بنفحات الزعفران والعنبر والورد لإطلالة مسائية أنيقة.",
    categorySlug: "beauty",
    price: "420",
    comparePrice: "520",
    stock: 15,
    sku: "BB-ROP-002",
    brand: "Majlis Scents",
    isFeatured: true,
    rating: "4.7",
    reviewCount: 88,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1000&q=80"
  },
  {
    slug: "smart-travel-headphones",
    nameEn: "Smart Travel Headphones",
    nameAr: "سماعات السفر الذكية",
    descriptionEn: "Noise-cancelling wireless headphones tuned for long flights, calls, and immersive music.",
    descriptionAr: "سماعات لاسلكية بعزل ضوضاء مناسبة للرحلات الطويلة والمكالمات والموسيقى.",
    categorySlug: "electronics",
    price: "690",
    stock: 64,
    sku: "BB-STH-003",
    brand: "Nomad Tech",
    isFeatured: true,
    rating: "4.6",
    reviewCount: 203,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80"
  },
  {
    slug: "midnight-satin-abaya",
    nameEn: "Midnight Satin Abaya",
    nameAr: "\u0639\u0628\u0627\u064a\u0629 \u0633\u0627\u062a\u0627\u0646 \u0644\u064a\u0644\u064a\u0629",
    descriptionEn: "A flowing satin abaya with a clean silhouette for everyday elegance.",
    descriptionAr: "\u0639\u0628\u0627\u064a\u0629 \u0633\u0627\u062a\u0627\u0646 \u0627\u0646\u0633\u064a\u0627\u0628\u064a\u0629 \u0628\u062a\u0635\u0645\u064a\u0645 \u0623\u0646\u064a\u0642.",
    categorySlug: "abaya-collection",
    price: "299",
    comparePrice: "359",
    stock: 22,
    sku: "BM-ABA-001",
    brand: "Best Mart Modest",
    isFeatured: true,
    rating: "4.8",
    reviewCount: 41,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85"
  },
  {
    slug: "sand-embroidered-abaya",
    nameEn: "Sand Embroidered Abaya",
    nameAr: "\u0639\u0628\u0627\u064a\u0629 \u0631\u0645\u0644\u064a\u0629 \u0645\u0637\u0631\u0632\u0629",
    descriptionEn: "A soft sand-tone abaya with delicate embroidered sleeve detail.",
    descriptionAr: "\u0639\u0628\u0627\u064a\u0629 \u0628\u0644\u0648\u0646 \u0631\u0645\u0644\u064a \u0648\u062a\u0641\u0627\u0635\u064a\u0644 \u0645\u0637\u0631\u0632\u0629.",
    categorySlug: "abaya-collection",
    price: "329",
    comparePrice: "399",
    stock: 18,
    sku: "BM-ABA-002",
    brand: "Best Mart Modest",
    isFeatured: true,
    rating: "4.7",
    reviewCount: 29,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85"
  },
  {
    slug: "midnight-chiffon-niqab",
    nameEn: "Midnight Chiffon Niqab",
    nameAr: "\u0646\u0642\u0627\u0628 \u0634\u064a\u0641\u0648\u0646 \u0644\u064a\u0644\u064a",
    descriptionEn: "Lightweight chiffon niqab designed for soft, breathable coverage.",
    descriptionAr: "\u0646\u0642\u0627\u0628 \u0634\u064a\u0641\u0648\u0646 \u062e\u0641\u064a\u0641 \u0648\u0645\u0631\u064a\u062d.",
    categorySlug: "niqab",
    price: "79",
    comparePrice: "99",
    stock: 35,
    sku: "BM-NIQ-001",
    brand: "Best Mart Modest",
    isFeatured: true,
    rating: "4.9",
    reviewCount: 64,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85"
  },
  {
    slug: "pearl-soft-niqab",
    nameEn: "Pearl Soft Niqab",
    nameAr: "\u0646\u0642\u0627\u0628 \u0644\u0624\u0644\u0624\u064a \u0646\u0627\u0639\u0645",
    descriptionEn: "A soft drape niqab with an adjustable fit for daily wear.",
    descriptionAr: "\u0646\u0642\u0627\u0628 \u0646\u0627\u0639\u0645 \u0628\u0642\u0635\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u0639\u062f\u064a\u0644.",
    categorySlug: "niqab",
    price: "85",
    comparePrice: "109",
    stock: 27,
    sku: "BM-NIQ-002",
    brand: "Best Mart Modest",
    isFeatured: false,
    rating: "4.7",
    reviewCount: 36,
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85"
  },
  {
    slug: "moonlight-prayer-dress-set",
    nameEn: "Moonlight Prayer Dress Set",
    nameAr: "\u0637\u0642\u0645 \u0641\u0633\u062a\u0627\u0646 \u0635\u0644\u0627\u0629 \u0645\u0648\u0646\u0644\u0627\u064a\u062a",
    descriptionEn: "A two-piece prayer dress set with a relaxed full-length fit.",
    descriptionAr: "\u0637\u0642\u0645 \u0635\u0644\u0627\u0629 \u0645\u0646 \u0642\u0637\u0639\u062a\u064a\u0646 \u0628\u0642\u0635\u0629 \u0645\u0631\u064a\u062d\u0629.",
    categorySlug: "prayer-dress-set",
    price: "189",
    comparePrice: "239",
    stock: 20,
    sku: "BM-PRY-001",
    brand: "Best Mart Modest",
    isFeatured: true,
    rating: "4.8",
    reviewCount: 52,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85"
  },
  {
    slug: "sage-prayer-dress-set",
    nameEn: "Sage Prayer Dress Set",
    nameAr: "\u0637\u0642\u0645 \u0641\u0633\u062a\u0627\u0646 \u0635\u0644\u0627\u0629 \u0633\u064a\u062c",
    descriptionEn: "A graceful prayer set in a muted sage shade with an easy fit.",
    descriptionAr: "\u0637\u0642\u0645 \u0635\u0644\u0627\u0629 \u0623\u0646\u064a\u0642 \u0628\u0644\u0648\u0646 \u0633\u064a\u062c \u0647\u0627\u062f\u0626.",
    categorySlug: "prayer-dress-set",
    price: "199",
    comparePrice: "249",
    stock: 16,
    sku: "BM-PRY-002",
    brand: "Best Mart Modest",
    isFeatured: false,
    rating: "4.6",
    reviewCount: 21,
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=85"
  }
];

const productVariants = {
  "desert-gold-watch": [
    {
      colorNameEn: "Gold",
      colorNameAr: "ذهبي",
      colorHex: "#d4af37",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-DGW-001-GOLD",
      stock: 10,
      sortOrder: 0,
      isActive: true
    },
    {
      colorNameEn: "Black",
      colorNameAr: "أسود",
      colorHex: "#111827",
      imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-DGW-001-BLACK",
      stock: 8,
      sortOrder: 1,
      isActive: true
    },
    {
      colorNameEn: "Rose Gold",
      colorNameAr: "ذهبي وردي",
      colorHex: "#b76e79",
      imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-DGW-001-ROSE-GOLD",
      stock: 6,
      sortOrder: 2,
      isActive: true
    },
    {
      colorNameEn: "Navy",
      colorNameAr: "كحلي",
      colorHex: "#1e3a8a",
      imageUrl: "https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-DGW-001-NAVY",
      stock: 4,
      sortOrder: 3,
      isActive: true
    }
  ],
  "royal-oud-perfume": [
    {
      colorNameEn: "Amber",
      colorNameAr: "عنبر",
      colorHex: "#b45309",
      imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-ROP-002-AMBER",
      stock: 5,
      sortOrder: 0,
      isActive: true
    },
    {
      colorNameEn: "Rose",
      colorNameAr: "وردي",
      colorHex: "#fb7185",
      imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-ROP-002-ROSE",
      stock: 4,
      sortOrder: 1,
      isActive: true
    },
    {
      colorNameEn: "Brown",
      colorNameAr: "بني",
      colorHex: "#7c2d12",
      imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-ROP-002-BROWN",
      stock: 3,
      sortOrder: 2,
      isActive: true
    },
    {
      colorNameEn: "Red",
      colorNameAr: "أحمر",
      colorHex: "#dc2626",
      imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-ROP-002-RED",
      stock: 3,
      sortOrder: 3,
      isActive: true
    }
  ],
  "smart-travel-headphones": [
    {
      colorNameEn: "Black",
      colorNameAr: "أسود",
      colorHex: "#111827",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-STH-003-BLACK",
      stock: 18,
      sortOrder: 0,
      isActive: true
    },
    {
      colorNameEn: "Silver",
      colorNameAr: "فضي",
      colorHex: "#cbd5e1",
      imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-STH-003-SILVER",
      stock: 16,
      sortOrder: 1,
      isActive: true
    },
    {
      colorNameEn: "Blue",
      colorNameAr: "أزرق",
      colorHex: "#2563eb",
      imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-STH-003-BLUE",
      stock: 10,
      sortOrder: 2,
      isActive: true
    },
    {
      colorNameEn: "White",
      colorNameAr: "أبيض",
      colorHex: "#ffffff",
      imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-STH-003-WHITE",
      stock: 8,
      sortOrder: 3,
      isActive: true
    },
    {
      colorNameEn: "Purple",
      colorNameAr: "بنفسجي",
      colorHex: "#7c3aed",
      imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-STH-003-PURPLE",
      stock: 7,
      sortOrder: 4,
      isActive: true
    },
    {
      colorNameEn: "Graphite",
      colorNameAr: "جرافيت",
      colorHex: "#374151",
      imageUrl: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&w=1000&q=80",
      sku: "BB-STH-003-GRAPHITE",
      stock: 5,
      sortOrder: 5,
      isActive: true
    }
  ],
  "midnight-satin-abaya": [
    { colorNameEn: "Black", colorNameAr: "\u0623\u0633\u0648\u062f", colorHex: "#161616", sizeKey: "52", sizeNameEn: "52", sizeNameAr: "52", imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85", sku: "BM-ABA-001-BLK-52", stock: 7, sortOrder: 0, isActive: true },
    { colorNameEn: "Black", colorNameAr: "\u0623\u0633\u0648\u062f", colorHex: "#161616", sizeKey: "54", sizeNameEn: "54", sizeNameAr: "54", imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85", sku: "BM-ABA-001-BLK-54", stock: 8, sortOrder: 1, isActive: true },
    { colorNameEn: "Maroon", colorNameAr: "\u0645\u0627\u0631\u0648\u0646", colorHex: "#7f1d1d", sizeKey: "56", sizeNameEn: "56", sizeNameAr: "56", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85", sku: "BM-ABA-001-MRN-56", stock: 7, sortOrder: 2, isActive: true }
  ],
  "sand-embroidered-abaya": [
    { colorNameEn: "Sand", colorNameAr: "\u0631\u0645\u0644\u064a", colorHex: "#c4a484", sizeKey: "52", sizeNameEn: "52", sizeNameAr: "52", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85", sku: "BM-ABA-002-SND-52", stock: 6, sortOrder: 0, isActive: true },
    { colorNameEn: "Sand", colorNameAr: "\u0631\u0645\u0644\u064a", colorHex: "#c4a484", sizeKey: "54", sizeNameEn: "54", sizeNameAr: "54", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85", sku: "BM-ABA-002-SND-54", stock: 6, sortOrder: 1, isActive: true },
    { colorNameEn: "Olive", colorNameAr: "\u0632\u064a\u062a\u0648\u0646\u064a", colorHex: "#556b2f", sizeKey: "56", sizeNameEn: "56", sizeNameAr: "56", imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=85", sku: "BM-ABA-002-OLV-56", stock: 6, sortOrder: 2, isActive: true }
  ],
  "midnight-chiffon-niqab": [
    { colorNameEn: "Black", colorNameAr: "\u0623\u0633\u0648\u062f", colorHex: "#171717", imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85", sku: "BM-NIQ-001-BLK", stock: 18, sortOrder: 0, isActive: true },
    { colorNameEn: "Navy", colorNameAr: "\u0643\u062d\u0644\u064a", colorHex: "#1e3a5f", imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85", sku: "BM-NIQ-001-NVY", stock: 17, sortOrder: 1, isActive: true }
  ],
  "pearl-soft-niqab": [
    { colorNameEn: "Pearl", colorNameAr: "\u0644\u0624\u0644\u0624\u064a", colorHex: "#f4f0e8", imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85", sku: "BM-NIQ-002-PRL", stock: 14, sortOrder: 0, isActive: true },
    { colorNameEn: "Taupe", colorNameAr: "\u062a\u0648\u0628", colorHex: "#8b6f61", imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=85", sku: "BM-NIQ-002-TPE", stock: 13, sortOrder: 1, isActive: true }
  ],
  "moonlight-prayer-dress-set": [
    { colorNameEn: "Dusty Blue", colorNameAr: "\u0623\u0632\u0631\u0642 \u063a\u0628\u0627\u0631\u064a", colorHex: "#718096", sizeKey: "S/M", sizeNameEn: "S/M", sizeNameAr: "S/M", imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85", sku: "BM-PRY-001-BLU-SM", stock: 10, sortOrder: 0, isActive: true },
    { colorNameEn: "Dusty Blue", colorNameAr: "\u0623\u0632\u0631\u0642 \u063a\u0628\u0627\u0631\u064a", colorHex: "#718096", sizeKey: "L/XL", sizeNameEn: "L/XL", sizeNameAr: "L/XL", imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85", sku: "BM-PRY-001-BLU-LX", stock: 10, sortOrder: 1, isActive: true }
  ],
  "sage-prayer-dress-set": [
    { colorNameEn: "Sage", colorNameAr: "\u0633\u064a\u062c", colorHex: "#8a9a5b", sizeKey: "S/M", sizeNameEn: "S/M", sizeNameAr: "S/M", imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=85", sku: "BM-PRY-002-SGE-SM", stock: 8, sortOrder: 0, isActive: true },
    { colorNameEn: "Sage", colorNameAr: "\u0633\u064a\u062c", colorHex: "#8a9a5b", sizeKey: "L/XL", sizeNameEn: "L/XL", sizeNameAr: "L/XL", imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=85", sku: "BM-PRY-002-SGE-LX", stock: 8, sortOrder: 1, isActive: true }
  ]
};

const banners = [
  {
    id: "home-hero-1",
    titleEn: "Dubai Gold Weekend",
    titleAr: "عطلة ذهب دبي",
    subtitleEn: "Premium picks for fast Dubai delivery.",
    subtitleAr: "اختيارات فاخرة بتوصيل سريع داخل دبي.",
    buttonTextEn: "Shop now",
    buttonTextAr: "تسوق الآن",
    buttonLink: "/shop?tag=sale",
    desktopImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=85",
    mobileImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=85",
    sortOrder: 1,
    isActive: true
  },
  {
    id: "home-hero-2",
    titleEn: "Fresh Tech Arrivals",
    titleAr: "وصلت تقنيات جديدة",
    subtitleEn: "Smart accessories, headphones, and travel essentials with live stock.",
    subtitleAr: "إكسسوارات ذكية وسماعات ومستلزمات سفر مع توفر مباشر.",
    buttonTextEn: "Explore tech",
    buttonTextAr: "اكتشف التقنية",
    buttonLink: "/shop?category=electronics",
    desktopImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1800&q=85",
    mobileImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=85",
    sortOrder: 2,
    isActive: true
  },
  {
    id: "home-hero-3",
    titleEn: "Luxury Gifts Ready",
    titleAr: "هدايا فاخرة جاهزة",
    subtitleEn: "Curated watches, perfumes, and premium finds for special moments.",
    subtitleAr: "ساعات وعطور واختيارات فاخرة للمناسبات الخاصة.",
    buttonTextEn: "Shop gifts",
    buttonTextAr: "تسوق الهدايا",
    buttonLink: "/shop?category=luxury",
    desktopImage: "https://images.unsplash.com/photo-1512163143273-bde0e3cc7407?auto=format&fit=crop&w=1800&q=85",
    mobileImage: "https://images.unsplash.com/photo-1512163143273-bde0e3cc7407?auto=format&fit=crop&w=900&q=85",
    sortOrder: 3,
    isActive: true
  }
];

async function main() {
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  const seedUserPassword = process.env.SEED_USER_PASSWORD;

  if (!seedAdminPassword || !seedUserPassword) {
    throw new Error("SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD must be set in .env before seeding.");
  }

  const adminPassword = await bcrypt.hash(seedAdminPassword, 12);
  const userPassword = await bcrypt.hash(seedUserPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bestmart.ae" },
    update: { password: adminPassword, role: UserRole.ADMIN, isBanned: false },
    create: {
      name: "Omar Khan",
      email: "admin@bestmart.ae",
      password: adminPassword,
      role: UserRole.ADMIN,
      phone: "+971 50 222 3344",
      city: "Dubai",
      country: "UAE"
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: "aisha@example.com" },
    update: { password: userPassword },
    create: {
      name: "Aisha Rahman",
      email: "aisha@example.com",
      password: userPassword,
      role: UserRole.USER,
      phone: "+971 55 123 1122",
      street: "Business Bay, Tower 21",
      city: "Dubai",
      country: "UAE"
    }
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    });
  }

  for (const product of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: product.categorySlug }
    });

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        descriptionEn: product.descriptionEn,
        descriptionAr: product.descriptionAr,
        categoryId: category.id,
        price: product.price,
        comparePrice: product.comparePrice ?? null,
        stock: product.stock,
        sku: product.sku,
        brand: product.brand,
        isFeatured: product.isFeatured,
        rating: product.rating,
        reviewCount: product.reviewCount
      },
      create: {
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        descriptionEn: product.descriptionEn,
        descriptionAr: product.descriptionAr,
        slug: product.slug,
        categoryId: category.id,
        price: product.price,
        comparePrice: product.comparePrice ?? null,
        stock: product.stock,
        sku: product.sku,
        brand: product.brand,
        tags: ["featured"],
        isFeatured: product.isFeatured,
        rating: product.rating,
        reviewCount: product.reviewCount,
        images: {
          create: {
            url: product.image,
            alt: product.nameEn,
            sortOrder: 0
          }
        },
        specifications: {
          create: [
            {
              keyEn: "Warranty",
              keyAr: "الضمان",
              valueEn: "1 year",
              valueAr: "سنة واحدة",
              sortOrder: 0
            }
          ]
        }
      }
    });

    for (const variant of productVariants[product.slug] ?? []) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: {
          productId: savedProduct.id,
          colorNameEn: variant.colorNameEn,
          colorNameAr: variant.colorNameAr,
          colorHex: variant.colorHex,
          imageUrl: variant.imageUrl,
          stock: variant.stock,
          sortOrder: variant.sortOrder,
          isActive: variant.isActive
        },
        create: {
          productId: savedProduct.id,
          ...variant
        }
      });
    }
  }

  await prisma.coupon.upsert({
    where: { code: "DUBAI50" },
    update: {},
    create: {
      code: "DUBAI50",
      discountType: DiscountType.FIXED,
      discountValue: "50",
      minOrderAmount: "250",
      maxUses: 500,
      expiryDate: new Date("2026-07-31T23:59:59.000Z"),
      isActive: true
    }
  });

  await prisma.banner.upsert({
    where: { id: "home-hero-1" },
    update: {},
    create: {
      id: "home-hero-1",
      titleEn: "Dubai Gold Weekend",
      titleAr: "عطلة ذهب دبي",
      subtitleEn: "Premium picks for fast Dubai delivery.",
      subtitleAr: "اختيارات فاخرة بتوصيل سريع داخل دبي.",
      buttonTextEn: "Shop now",
      buttonTextAr: "تسوق الآن",
      buttonLink: "/shop?tag=sale",
      desktopImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=85",
      sortOrder: 1,
      isActive: true
    }
  });

  for (const banner of banners.filter((item) => item.id !== "home-hero-1")) {
    await prisma.banner.upsert({
      where: { id: banner.id },
      update: banner,
      create: banner
    });
  }

  const homepageSections = [
    {
      id: "home-section-categories",
      type: "CATEGORY_GRID",
      titleEn: "Shop by category",
      titleAr: "تسوق حسب الفئة",
      subtitleEn: "Browse the collections managed from your admin panel.",
      subtitleAr: "تصفح المجموعات التي تتم إدارتها من لوحة التحكم.",
      config: { categoryLimit: 6, actionLink: "/shop", actionLabelEn: "View all", actionLabelAr: "عرض الكل" },
      sortOrder: 1,
      isActive: true
    },
    {
      id: "home-section-category-products",
      type: "CATEGORY_PRODUCT_ROWS",
      titleEn: "Shop by category",
      titleAr: "تسوق حسب الفئة",
      subtitleEn: "",
      subtitleAr: "",
      config: { limit: 5, actionLink: "/shop", actionLabelEn: "View all", actionLabelAr: "عرض الكل" },
      sortOrder: 2,
      isActive: true
    },
    {
      id: "home-section-featured",
      type: "PRODUCT_GRID",
      titleEn: "Exclusive Sale",
      titleAr: "عروض حصرية",
      subtitleEn: "Selected pieces with live product and stock data.",
      subtitleAr: "منتجات مختارة مع بيانات المخزون المباشرة.",
      config: { source: "FEATURED", limit: 4, actionLink: "/shop", actionLabelEn: "View all", actionLabelAr: "عرض الكل" },
      sortOrder: 3,
      isActive: true
    },
    {
      id: "home-section-new",
      type: "PRODUCT_GRID",
      titleEn: "New Arrival",
      titleAr: "وصل حديثا",
      subtitleEn: "Fresh products published by the admin.",
      subtitleAr: "منتجات جديدة تم نشرها من قبل الإدارة.",
      config: { source: "NEW", limit: 4, actionLink: "/shop?sort=new", actionLabelEn: "View all", actionLabelAr: "عرض الكل" },
      sortOrder: 4,
      isActive: true
    }
  ];

  for (const section of homepageSections) {
    await prisma.homepageSection.upsert({
      where: { id: section.id },
      update: section,
      create: section
    });
  }

  await prisma.setting.upsert({
    where: { id: "store-settings" },
    update: {},
    create: {
      storeNameEn: "Best Mart",
      storeNameAr: "بيست مارت",
      storeEmail: "support@bestmart.ae",
      phone: "+971 4 555 0198",
      whatsapp: "+971 55 555 0198",
      address: "Business Bay, Dubai",
      announcementEn: "Free Dubai delivery on orders above AED 250",
      announcementAr: "توصيل مجاني داخل دبي للطلبات فوق 250 درهم",
      aedToBdt: "33.5",
      aedToUsd: "0.272",
      freeShippingThreshold: "250",
      shippingRates: [
        { emirate: "Dubai", cost: 20, deliveryDays: "1-2" },
        { emirate: "Abu Dhabi", cost: 35, deliveryDays: "2-3" },
        { emirate: "Sharjah", cost: 25, deliveryDays: "1-3" },
        { emirate: "Ajman", cost: 30, deliveryDays: "2-3" },
        { emirate: "Ras Al Khaimah", cost: 40, deliveryDays: "3-4" },
        { emirate: "Fujairah", cost: 40, deliveryDays: "3-4" },
        { emirate: "Umm Al Quwain", cost: 35, deliveryDays: "3-4" }
      ],
      courierSettings: {
        enabled: false,
        provider: "manual",
        displayName: "Dubai delivery partner",
        accountNumber: "",
        apiKey: "",
        apiSecret: "",
        webhookSecret: "",
        trackingUrlTemplate: "",
        pickupCity: "Dubai",
        serviceLevel: "standard",
        notes: ""
      },
      metaTitleEn: "Best Mart Dubai",
      metaTitleAr: "بيست مارت دبي",
      metaDescriptionEn: "Luxury Dubai ecommerce for gifts, fashion, electronics, beauty, and home.",
      metaDescriptionAr: "تجارة إلكترونية فاخرة في دبي للهدايا والأزياء والإلكترونيات والجمال والمنزل."
    }
  });

  await prisma.order.upsert({
    where: { orderNumber: "BB-1001" },
    update: {},
    create: {
      orderNumber: "BB-1001",
      userId: customer.id,
      customerName: "Aisha Rahman",
      customerEmail: "aisha@example.com",
      customerPhone: "+971 55 123 1122",
      street: "Business Bay, Tower 21",
      city: "Dubai",
      emirate: "Dubai",
      country: "UAE",
      paymentMethod: PaymentMethod.STRIPE,
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.PROCESSING,
      subtotal: "840",
      shippingCost: "0",
      discount: "50",
      total: "790",
      currency: "AED",
      items: {
        create: {
          nameEn: "Royal Oud Perfume",
          nameAr: "عطر العود الملكي",
          price: "420",
          quantity: 2,
          image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1000&q=80"
        }
      }
    }
  });

  console.log(`Seed complete. Admin user: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
