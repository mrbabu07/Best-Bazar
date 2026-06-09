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
    nameEn: "Electronics",
    nameAr: "الإلكترونيات",
    slug: "electronics",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80",
    sortOrder: 3
  },
  {
    nameEn: "Home Living",
    nameAr: "المنزل",
    slug: "home",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
    sortOrder: 4
  },
  {
    nameEn: "Beauty",
    nameAr: "الجمال",
    slug: "beauty",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    sortOrder: 5
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
    stock: 18,
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
    stock: 9,
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
    stock: 34,
    sku: "BB-STH-003",
    brand: "Nomad Tech",
    isFeatured: true,
    rating: "4.6",
    reviewCount: 203,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80"
  }
];

const productVariants = {
  "desert-gold-watch": [
    {
      colorNameEn: "Gold",
      colorNameAr: "ذهبي",
      colorHex: "#d4af37",
      sku: "BB-DGW-001-GOLD",
      stock: 10,
      sortOrder: 0,
      isActive: true
    },
    {
      colorNameEn: "Black",
      colorNameAr: "أسود",
      colorHex: "#111827",
      sku: "BB-DGW-001-BLACK",
      stock: 8,
      sortOrder: 1,
      isActive: true
    }
  ],
  "royal-oud-perfume": [
    {
      colorNameEn: "Amber",
      colorNameAr: "عنبر",
      colorHex: "#b45309",
      sku: "BB-ROP-002-AMBER",
      stock: 5,
      sortOrder: 0,
      isActive: true
    },
    {
      colorNameEn: "Rose",
      colorNameAr: "وردي",
      colorHex: "#fb7185",
      sku: "BB-ROP-002-ROSE",
      stock: 4,
      sortOrder: 1,
      isActive: true
    }
  ],
  "smart-travel-headphones": [
    {
      colorNameEn: "Black",
      colorNameAr: "أسود",
      colorHex: "#111827",
      sku: "BB-STH-003-BLACK",
      stock: 18,
      sortOrder: 0,
      isActive: true
    },
    {
      colorNameEn: "Silver",
      colorNameAr: "فضي",
      colorHex: "#cbd5e1",
      sku: "BB-STH-003-SILVER",
      stock: 16,
      sortOrder: 1,
      isActive: true
    }
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
    where: { email: "admin@bestbazar.ae" },
    update: { password: adminPassword, role: UserRole.ADMIN, isBanned: false },
    create: {
      name: "Omar Khan",
      email: "admin@bestbazar.ae",
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

  await prisma.setting.upsert({
    where: { id: "store-settings" },
    update: {},
    create: {
      storeNameEn: "Best Bazar",
      storeNameAr: "بيست بازار",
      storeEmail: "support@bestbazar.ae",
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
      metaTitleEn: "Best Bazar Dubai",
      metaTitleAr: "بيست بازار دبي",
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
