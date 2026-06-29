import type { Order, OrderItem } from "@prisma/client";
import { getOrderConfirmationUrl } from "@/lib/email";

type OrderWithItems = Order & {
  items: OrderItem[];
};

type NotificationPurpose = "created" | "status";

function normalizeUaePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("00")) {
    return `+${digits.slice(2)}`;
  }

  if (digits.startsWith("0")) {
    return `+971${digits.slice(1)}`;
  }

  return `+${digits}`;
}

function twilioAddress(channel: "sms" | "whatsapp", phone: string) {
  const normalized = normalizeUaePhone(phone);

  if (!normalized) {
    return "";
  }

  return channel === "whatsapp" ? `whatsapp:${normalized}` : normalized;
}

function getTwilioConfig(channel: "sms" | "whatsapp") {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from =
    channel === "whatsapp"
      ? process.env.TWILIO_WHATSAPP_FROM
      : process.env.TWILIO_SMS_FROM;

  if (!accountSid || !authToken || !from) {
    return null;
  }

  return { accountSid, authToken, from };
}

async function sendTwilioMessage({
  channel,
  to,
  body
}: {
  channel: "sms" | "whatsapp";
  to: string;
  body: string;
}) {
  const config = getTwilioConfig(channel);
  const recipient = twilioAddress(channel, to);

  if (!config || !recipient) {
    return { sent: false, reason: `${channel} notification is not configured.` };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      From: config.from,
      To: recipient,
      Body: body
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio ${channel} notification failed: ${text}`);
  }

  return { sent: true };
}

function customerMessage(order: OrderWithItems, purpose: NotificationPurpose) {
  const url = getOrderConfirmationUrl(order);
  const lead =
    purpose === "created"
      ? `Best Mart received your order ${order.orderNumber}.`
      : `Best Mart order ${order.orderNumber} is now ${order.orderStatus}.`;

  return [
    lead,
    `Total: AED ${Number(order.total).toFixed(2)}.`,
    order.deliveryEstimate ? `Delivery estimate: ${order.deliveryEstimate}.` : "",
    order.deliverySlot ? `Preferred time: ${order.deliverySlot}.` : "",
    url ? `Track: ${url}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function adminMessage(order: OrderWithItems, purpose: NotificationPurpose) {
  const lead =
    purpose === "created"
      ? `New Best Mart order ${order.orderNumber}`
      : `Best Mart order ${order.orderNumber} updated to ${order.orderStatus}`;

  return [
    lead,
    `${order.customerName} (${order.customerPhone})`,
    `AED ${Number(order.total).toFixed(2)}`,
    order.deliveryEstimate ? `Delivery estimate: ${order.deliveryEstimate}` : "",
    order.deliverySlot ? `Preferred time: ${order.deliverySlot}` : ""
  ]
    .filter(Boolean)
    .join(" | ");
}

export async function sendOrderMessagingNotifications(order: OrderWithItems, purpose: NotificationPurpose) {
  const adminPhone = process.env.ADMIN_ORDER_NOTIFICATION_PHONE;
  const jobs = [
    sendTwilioMessage({ channel: "sms", to: order.customerPhone, body: customerMessage(order, purpose) }),
    sendTwilioMessage({ channel: "whatsapp", to: order.customerPhone, body: customerMessage(order, purpose) }),
    ...(adminPhone
      ? [
          sendTwilioMessage({ channel: "sms", to: adminPhone, body: adminMessage(order, purpose) }),
          sendTwilioMessage({ channel: "whatsapp", to: adminPhone, body: adminMessage(order, purpose) })
        ]
      : [])
  ];

  return Promise.allSettled(jobs);
}
