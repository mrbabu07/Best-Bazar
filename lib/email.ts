import nodemailer from "nodemailer";
import type { Order, OrderItem } from "@prisma/client";

type OrderWithItems = Order & {
  items: OrderItem[];
};

function getEmailConfig() {
  const server = process.env.EMAIL_SERVER;
  const from = process.env.EMAIL_FROM;

  if (!server || !from) {
    return null;
  }

  return { server, from };
}

export async function sendOrderConfirmationEmail(order: OrderWithItems) {
  const config = getEmailConfig();

  if (!config) {
    return { sent: false, reason: "EMAIL_SERVER or EMAIL_FROM is not configured." };
  }

  const transporter = nodemailer.createTransport(config.server);
  const lines = order.items
    .map((item) => `${item.quantity} x ${item.nameEn} - AED ${Number(item.price).toFixed(2)}`)
    .join("\n");

  await transporter.sendMail({
    from: config.from,
    to: order.customerEmail,
    subject: `Best Bazar order ${order.orderNumber}`,
    text: [
      `Thank you for your order, ${order.customerName}.`,
      "",
      `Order number: ${order.orderNumber}`,
      `Status: ${order.orderStatus}`,
      `Payment: ${order.paymentMethod} / ${order.paymentStatus}`,
      "",
      lines,
      "",
      `Subtotal: AED ${Number(order.subtotal).toFixed(2)}`,
      `Shipping: AED ${Number(order.shippingCost).toFixed(2)}`,
      `Discount: AED ${Number(order.discount).toFixed(2)}`,
      `Total: AED ${Number(order.total).toFixed(2)}`
    ].join("\n")
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
    subject: "Reset your Best Bazar password",
    text: [
      `Hello${name ? ` ${name}` : ""},`,
      "",
      "Use the secure link below to reset your Best Bazar password.",
      "",
      resetUrl,
      "",
      "This link expires in 1 hour. If you did not request a password reset, you can ignore this email."
    ].join("\n")
  });

  return { sent: true };
}
