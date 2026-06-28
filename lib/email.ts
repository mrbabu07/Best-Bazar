import nodemailer from "nodemailer";
import type { Order, OrderItem, Product, ProductImage } from "@prisma/client";

type OrderWithItems = Order & {
  items: OrderItem[];
};

function money(value: unknown) {
  return `AED ${Number(value ?? 0).toFixed(2)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getEmailConfig() {
  const server = process.env.EMAIL_SERVER;
  const from = process.env.EMAIL_FROM;

  if (!server || !from) {
    return null;
  }

  return { server, from };
}

export function getOrderConfirmationUrl(order: OrderWithItems) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;

  if (!siteUrl || !order.accessToken) {
    return null;
  }

  const locale = order.locale === "ar" ? "ar" : "en";

  return `${siteUrl.replace(/\/$/, "")}/${locale}/order-confirmation/${order.id}?token=${order.accessToken}`;
}

export async function sendOrderConfirmationEmail(order: OrderWithItems) {
  const config = getEmailConfig();

  if (!config) {
    return { sent: false, reason: "EMAIL_SERVER or EMAIL_FROM is not configured." };
  }

  const transporter = nodemailer.createTransport(config.server);
  const lines = order.items.map((item) => {
    const variantName = item.variantNameEn ? ` / ${item.variantNameEn}` : "";

    return `${item.quantity} x ${item.nameEn}${variantName} - ${money(Number(item.price) * item.quantity)}`;
  });
  const confirmationUrl = getOrderConfirmationUrl(order);
  const addressLines = [
    order.street,
    order.tower ? `Building/Tower: ${order.tower}` : "",
    order.apartment ? `Apartment/Unit: ${order.apartment}` : "",
    `${order.city}, ${order.emirate}, ${order.country}`
  ].filter(Boolean);
  const totals = [
    ["Subtotal", money(order.subtotal)],
    ["Shipping", money(order.shippingCost)],
    ["Discount", `-${money(order.discount)}`],
    ...(Number(order.vatAmount) > 0
      ? [[`VAT included (${Number(order.vatRate).toFixed(2)}%)`, money(order.vatAmount)]]
      : []),
    ["Total", money(order.total)]
  ];
  const htmlRows = lines
    .map((line) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;">${escapeHtml(line)}</td></tr>`)
    .join("");
  const htmlTotals = totals
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 0;color:#666;">${escapeHtml(label)}</td><td style="padding:4px 0;text-align:right;font-weight:700;">${escapeHtml(value)}</td></tr>`
    )
    .join("");
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <h1 style="margin:0 0 8px;font-size:24px;">Thank you for your order</h1>
      <p style="margin:0 0 18px;color:#4b5563;">Hi ${escapeHtml(order.customerName)}, we received your Best Mart order.</p>
      <div style="border:1px solid #eee;border-radius:8px;padding:16px;margin-bottom:18px;">
        <p style="margin:0;font-weight:700;">${escapeHtml(order.orderNumber)}</p>
        <p style="margin:6px 0 0;color:#4b5563;">Status: ${escapeHtml(order.orderStatus)} | Payment: ${escapeHtml(order.paymentMethod)} / ${escapeHtml(order.paymentStatus)}</p>
        ${order.deliverySlot ? `<p style="margin:6px 0 0;color:#92400e;font-weight:700;">Delivery estimate: ${escapeHtml(order.deliverySlot)}</p>` : ""}
      </div>
      <h2 style="font-size:16px;margin:0 0 8px;">Delivery address</h2>
      <p style="margin:0 0 18px;color:#4b5563;line-height:1.6;">${addressLines.map(escapeHtml).join("<br />")}</p>
      <h2 style="font-size:16px;margin:0 0 8px;">Items</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">${htmlRows}</table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">${htmlTotals}</table>
      ${confirmationUrl ? `<p><a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;background:#172033;color:#fff;text-decoration:none;border-radius:6px;padding:12px 16px;font-weight:700;">View order</a></p>` : ""}
    </div>
  `;

  await transporter.sendMail({
    from: config.from,
    to: order.customerEmail,
    subject: `Best Mart order ${order.orderNumber}`,
    text: [
      `Thank you for your order, ${order.customerName}.`,
      "",
      `Order number: ${order.orderNumber}`,
      `Status: ${order.orderStatus}`,
      `Payment: ${order.paymentMethod} / ${order.paymentStatus}`,
      ...(order.deliverySlot ? [`Delivery estimate: ${order.deliverySlot}`] : []),
      "",
      "Delivery address:",
      ...addressLines,
      "",
      ...lines,
      "",
      ...totals.map(([label, value]) => `${label}: ${value}`),
      ...(confirmationUrl ? ["", `Order link: ${confirmationUrl}`] : [])
    ].join("\n"),
    html
  });

  return { sent: true };
}

export async function sendOrderStatusEmail(order: OrderWithItems) {
  const config = getEmailConfig();

  if (!config) {
    return { sent: false, reason: "EMAIL_SERVER or EMAIL_FROM is not configured." };
  }

  const transporter = nodemailer.createTransport(config.server);
  const confirmationUrl = getOrderConfirmationUrl(order);
  const subject = `Best Mart order ${order.orderNumber} is ${order.orderStatus}`;
  const text = [
    `Hello ${order.customerName},`,
    "",
    `Your order ${order.orderNumber} is now ${order.orderStatus}.`,
    `Payment: ${order.paymentMethod} / ${order.paymentStatus}`,
    ...(order.deliverySlot ? [`Delivery estimate: ${order.deliverySlot}`] : []),
    ...(confirmationUrl ? ["", `Order link: ${confirmationUrl}`] : [])
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <h1 style="margin:0 0 8px;font-size:24px;">Order status update</h1>
      <p style="margin:0 0 18px;color:#4b5563;">Hello ${escapeHtml(order.customerName)}, your order has a new update.</p>
      <div style="border:1px solid #eee;border-radius:8px;padding:16px;margin-bottom:18px;">
        <p style="margin:0;font-weight:700;">${escapeHtml(order.orderNumber)}</p>
        <p style="margin:6px 0 0;color:#4b5563;">Status: <strong>${escapeHtml(order.orderStatus)}</strong></p>
        <p style="margin:6px 0 0;color:#4b5563;">Payment: ${escapeHtml(order.paymentMethod)} / ${escapeHtml(order.paymentStatus)}</p>
        ${order.deliverySlot ? `<p style="margin:6px 0 0;color:#92400e;font-weight:700;">Delivery estimate: ${escapeHtml(order.deliverySlot)}</p>` : ""}
      </div>
      ${confirmationUrl ? `<p><a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;background:#172033;color:#fff;text-decoration:none;border-radius:6px;padding:12px 16px;font-weight:700;">View order</a></p>` : ""}
    </div>
  `;

  await transporter.sendMail({
    from: config.from,
    to: order.customerEmail,
    subject,
    text,
    html
  });

  return { sent: true };
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl
}: {
  to: string;
  name?: string | null;
  resetUrl: string;
}) {
  const config = getEmailConfig();

  if (!config) {
    return { sent: false, reason: "EMAIL_SERVER or EMAIL_FROM is not configured." };
  }

  const transporter = nodemailer.createTransport(config.server);

  await transporter.sendMail({
    from: config.from,
    to,
    subject: "Reset your Best Mart password",
    text: [
      `Hello${name ? ` ${name}` : ""},`,
      "",
      "Use the secure link below to reset your Best Mart password.",
      "",
      resetUrl,
      "",
      "This link expires in 1 hour. If you did not request a password reset, you can ignore this email."
    ].join("\n")
  });

  return { sent: true };
}

type ProductWithImages = Product & {
  images: ProductImage[];
};

export async function sendNewProductOfferEmail({
  product,
  recipients
}: {
  product: ProductWithImages;
  recipients: string[];
}) {
  const config = getEmailConfig();
  const activeRecipients = Array.from(new Set(recipients.map((item) => item.trim().toLowerCase()).filter(Boolean)));

  if (!config) {
    return { sent: false, reason: "EMAIL_SERVER or EMAIL_FROM is not configured." };
  }

  if (!activeRecipients.length) {
    return { sent: false, reason: "No active newsletter subscribers." };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  const productUrl = siteUrl ? `${siteUrl}/en/product/${product.slug}` : "";
  const imageUrl = product.images[0]?.url;
  const transporter = nodemailer.createTransport(config.server);
  const price = money(product.price);
  const comparePrice = product.comparePrice ? money(product.comparePrice) : "";
  const subject = `New arrival: ${product.nameEn}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111;">
      <p style="margin:0 0 10px;text-transform:uppercase;letter-spacing:.16em;font-size:12px;color:#666;">Best Mart new arrival</p>
      <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">${escapeHtml(product.nameEn)}</h1>
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.nameEn)}" style="width:100%;max-height:520px;object-fit:cover;margin:0 0 18px;border:1px solid #eee;" />` : ""}
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;">${escapeHtml(price)}${comparePrice ? ` <span style="font-size:14px;color:#777;text-decoration:line-through;font-weight:400;">${escapeHtml(comparePrice)}</span>` : ""}</p>
      <p style="margin:0 0 20px;color:#555;line-height:1.7;">${escapeHtml(product.descriptionEn).slice(0, 240)}</p>
      ${productUrl ? `<a href="${escapeHtml(productUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 24px;font-weight:700;">Shop now</a>` : ""}
    </div>
  `;

  await transporter.sendMail({
    from: config.from,
    to: config.from,
    bcc: activeRecipients,
    subject,
    text: [
      "Best Mart new arrival",
      "",
      product.nameEn,
      price,
      product.descriptionEn,
      productUrl
    ].filter(Boolean).join("\n"),
    html
  });

  return { sent: true, count: activeRecipients.length };
}
