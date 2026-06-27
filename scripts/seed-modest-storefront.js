const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const uploadedImages = [
  "https://res.cloudinary.com/dtti0ainh/image/upload/f_auto,q_auto,c_fill,g_auto,ar_4:5,w_1200/v1782446290/best-mart/products/ctxb9hgdfrsuaciotplh.jpg",
  "https://res.cloudinary.com/dtti0ainh/image/upload/f_auto,q_auto,c_fill,g_auto,ar_4:5,w_1200/v1782446292/best-mart/products/n2fkx05onl9k5dog6vvo.jpg",
  "https://res.cloudinary.com/dtti0ainh/image/upload/f_auto,q_auto,c_fill,g_auto,ar_4:5,w_1200/v1782446293/best-mart/products/l27ljjls9k3p6mvwuvef.jpg",
  "https://res.cloudinary.com/dtti0ainh/image/upload/f_auto,q_auto,c_fill,g_auto,ar_4:5,w_1200/v1782446295/best-mart/products/umm9leo4qgoyac126iso.jpg"
];
const heroMobileImages = uploadedImages.map((image) =>
  image.replace("c_fill,g_auto,ar_4:5,w_1200", "c_fill,g_auto,ar_4:5,w_900")
);

const catalog = [
  {
    slug: "mist-blue-abaya-set",
    name: "Mist Blue Abaya Set",
    category: "abaya-collection",
    image: uploadedImages[0],
    color: "Mist Blue",
    colorHex: "#8296aa",
    price: 319,
    comparePrice: 399,
    sku: "BM-MAYA-ABA-101"
  },
  {
    slug: "lavender-satin-abaya",
    name: "Lavender Satin Abaya",
    category: "abaya-collection",
    image: uploadedImages[1],
    color: "Lavender",
    colorHex: "#a68aa7",
    price: 289,
    comparePrice: 359,
    sku: "BM-MAYA-ABA-102"
  },
  {
    slug: "emerald-flow-abaya",
    name: "Emerald Flow Abaya",
    category: "abaya-collection",
    image: uploadedImages[2],
    color: "Emerald",
    colorHex: "#174b3a",
    price: 299,
    comparePrice: 379,
    sku: "BM-MAYA-ABA-103"
  },
  {
    slug: "midnight-velvet-abaya",
    name: "Midnight Velvet Abaya",
    category: "abaya-collection",
    image: uploadedImages[3],
    color: "Midnight",
    colorHex: "#29262b",
    price: 279,
    comparePrice: 349,
    sku: "BM-MAYA-ABA-104"
  },
  {
    slug: "lavender-kimono-sheila",
    name: "Lavender Kimono And Sheila",
    category: "kimono-sheila",
    image: uploadedImages[1],
    color: "Lavender",
    colorHex: "#a68aa7",
    price: 229,
    comparePrice: 299,
    sku: "BM-MAYA-KIM-201"
  },
  {
    slug: "forest-kimono-sheila",
    name: "Forest Kimono And Sheila",
    category: "kimono-sheila",
    image: uploadedImages[2],
    color: "Forest Green",
    colorHex: "#174b3a",
    price: 239,
    comparePrice: 309,
    sku: "BM-MAYA-KIM-202"
  }
];

async function upsertProduct(item) {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: item.category } });
  const description = `${item.name} with a flowing modest silhouette, soft fabric, and an easy full-length fit.`;
  const product = await prisma.product.upsert({
    where: { slug: item.slug },
    update: {
      nameEn: item.name,
      nameAr: item.name,
      descriptionEn: description,
      descriptionAr: description,
      categoryId: category.id,
      price: item.price,
      comparePrice: item.comparePrice,
      stock: 18,
      sku: item.sku,
      brand: "Best Mart Modest",
      tags: ["modest", "new-arrival", "sale"],
      fashionFields: {
        fabric: "Soft satin blend",
        fit: "Relaxed",
        style: "Modest full length",
        occasion: "Daily wear and gatherings",
        season: "All season"
      },
      isActive: true,
      isFeatured: true
    },
    create: {
      nameEn: item.name,
      nameAr: item.name,
      descriptionEn: description,
      descriptionAr: description,
      slug: item.slug,
      categoryId: category.id,
      price: item.price,
      comparePrice: item.comparePrice,
      stock: 18,
      sku: item.sku,
      brand: "Best Mart Modest",
      tags: ["modest", "new-arrival", "sale"],
      fashionFields: {
        fabric: "Soft satin blend",
        fit: "Relaxed",
        style: "Modest full length",
        occasion: "Daily wear and gatherings",
        season: "All season"
      },
      isActive: true,
      isFeatured: true
    }
  });

  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  await prisma.productVariant.deleteMany({ where: { productId: product.id } });
  await prisma.productImage.create({
    data: { productId: product.id, url: item.image, alt: item.name, sortOrder: 0 }
  });
  await prisma.productVariant.createMany({
    data: ["52", "54", "56"].map((size, index) => ({
      productId: product.id,
      colorNameEn: item.color,
      colorNameAr: item.color,
      colorHex: item.colorHex,
      sizeKey: size,
      sizeNameEn: size,
      sizeNameAr: size,
      imageUrl: item.image,
      sku: `${item.sku}-${size}`,
      stock: 6,
      sortOrder: index,
      isActive: true
    }))
  });
}

async function main() {
  await prisma.category.updateMany({
    where: { slug: { in: ["home", "123", "manfashion", "electronics", "luxury"] } },
    data: { isActive: false }
  });

  await prisma.category.update({
    where: { slug: "abaya-collection" },
    data: { isActive: true, sortOrder: 1, image: uploadedImages[0], nameEn: "Abayas", nameAr: "Abayas" }
  });
  await prisma.category.upsert({
    where: { slug: "kimono-sheila" },
    update: { isActive: true, sortOrder: 2, image: uploadedImages[1] },
    create: {
      nameEn: "Kimono And Sheila",
      nameAr: "Kimono And Sheila",
      slug: "kimono-sheila",
      image: uploadedImages[1],
      productType: "WOMENS_FASHION",
      isActive: true,
      sortOrder: 2
    }
  });
  await prisma.category.update({
    where: { slug: "niqab" },
    data: { isActive: true, sortOrder: 3, image: uploadedImages[3] }
  });
  await prisma.category.update({
    where: { slug: "prayer-dress-set" },
    data: { isActive: true, sortOrder: 4, image: uploadedImages[2] }
  });

  for (const item of catalog) {
    await upsertProduct(item);
  }

  await prisma.homepageSection.update({
    where: { id: "home-section-categories" },
    data: {
      titleEn: "New Collections",
      titleAr: "New Collections",
      subtitleEn: "Discover modest pieces curated for effortless UAE dressing.",
      subtitleAr: "Discover modest pieces curated for effortless UAE dressing.",
      config: { categoryLimit: 4, actionLink: "/shop", actionLabelEn: "Shop all", actionLabelAr: "Shop all" },
      sortOrder: 1,
      isActive: true
    }
  });
  await prisma.homepageSection.update({
    where: { id: "home-section-featured" },
    data: {
      titleEn: "Our Most Loved Collection",
      titleAr: "Our Most Loved Collection",
      subtitleEn: "",
      subtitleAr: "",
      sortOrder: 2,
      isActive: true
    }
  });
  await prisma.homepageSection.update({
    where: { id: "home-section-category-products" },
    data: { sortOrder: 3, isActive: true }
  });
  await prisma.homepageSection.update({
    where: { id: "home-section-new" },
    data: { isActive: false }
  });

  await prisma.banner.upsert({
    where: { id: "home-hero-2" },
    update: {
      titleEn: "New Modest Arrivals",
      titleAr: "New Modest Arrivals",
      subtitleEn: "Fresh abayas, kimonos, niqabs, and prayer sets.",
      subtitleAr: "Fresh abayas, kimonos, niqabs, and prayer sets.",
      buttonTextEn: "Explore",
      buttonTextAr: "Explore",
      buttonLink: "/shop?sort=new",
      desktopImage: uploadedImages[2],
      mobileImage: heroMobileImages[2],
      sortOrder: 1,
      isActive: true
    },
    create: {
      id: "home-hero-2",
      titleEn: "New Modest Arrivals",
      titleAr: "New Modest Arrivals",
      subtitleEn: "Fresh abayas, kimonos, niqabs, and prayer sets.",
      subtitleAr: "Fresh abayas, kimonos, niqabs, and prayer sets.",
      buttonTextEn: "Explore",
      buttonTextAr: "Explore",
      buttonLink: "/shop?sort=new",
      desktopImage: uploadedImages[2],
      mobileImage: heroMobileImages[2],
      sortOrder: 1,
      isActive: true
    }
  });
  await prisma.banner.upsert({
    where: { id: "home-hero-3" },
    update: {
      titleEn: "Elegant Daily Wear",
      titleAr: "Elegant Daily Wear",
      subtitleEn: "Soft silhouettes curated for effortless UAE dressing.",
      subtitleAr: "Soft silhouettes curated for effortless UAE dressing.",
      buttonTextEn: "Shop Abayas",
      buttonTextAr: "Shop Abayas",
      buttonLink: "/shop?category=abaya-collection",
      desktopImage: uploadedImages[1],
      mobileImage: heroMobileImages[1],
      sortOrder: 2,
      isActive: true
    },
    create: {
      id: "home-hero-3",
      titleEn: "Elegant Daily Wear",
      titleAr: "Elegant Daily Wear",
      subtitleEn: "Soft silhouettes curated for effortless UAE dressing.",
      subtitleAr: "Soft silhouettes curated for effortless UAE dressing.",
      buttonTextEn: "Shop Abayas",
      buttonTextAr: "Shop Abayas",
      buttonLink: "/shop?category=abaya-collection",
      desktopImage: uploadedImages[1],
      mobileImage: heroMobileImages[1],
      sortOrder: 2,
      isActive: true
    }
  });

  console.log(`Modest storefront catalog ready: ${catalog.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
