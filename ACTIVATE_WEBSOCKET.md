# 🚀 Activate WebSocket - 3 Simple Steps

Your WebSocket infrastructure is **ready** but not activated yet. Follow these 3 steps:

---

## Step 1: Build the Application

Stop your current server and build:

```bash
# Press Ctrl+C to stop server
Ctrl+C

# Build the app
npm run build
```

**What this does:**
- Generates the WebSocket server bundle
- Optimizes all code for production
- Creates `.next/server/chunks/socket-server.js`

**Expected output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

---

## Step 2: Start Server with WebSocket

```bash
npm start
```

**Expected output:**
```
> Ready on http://localhost:3002
> Environment: production
✅ Socket.IO server initialized
> WebSocket server ready on /api/socket
```

**If you see this ✅, WebSocket is working!**

---

## Step 3: Add Real-Time Components

### 3a. Admin Real-Time Notifications

Edit `app/[locale]/admin/layout.tsx` and add the component:

```typescript
import { AdminRealtimeNotifications } from "@/components/admin/AdminRealtimeNotifications";

export default async function AdminLayout({ children, params }) {
  // ... existing code ...
  
  return (
    <AdminShell
      locale={locale}
      dictionary={getDictionary(locale)}
      adminName={session.user.name ?? "Admin"}
      notifications={notifications}
    >
      {children}
      <AdminRealtimeNotifications />  {/* 👈 ADD THIS LINE */}
    </AdminShell>
  );
}
```

**What you get:**
- 🔔 Toast notifications when new orders arrive
- 📦 Alerts when order status changes
- 🟢 Connection status indicator

### 3b. Order Tracking (Optional)

When you have an order detail page, add:

```typescript
import { OrderTracker } from "@/components/order/OrderTracker";

// In your order detail page:
<OrderTracker orderId={order.id} currentStatus={order.status} />
```

**What you get:**
- 📍 Real-time order status updates
- 🔴 Live indicator
- ⚡ No page refresh needed

---

## ✅ Test It!

### Test Real-Time Notifications:

1. Open admin dashboard: http://localhost:3002/en/admin/dashboard
2. Open browser console (F12)
3. Look for: `✅ Connected to WebSocket`
4. Place a test order from the shop
5. Watch admin get a real-time notification! 🎉

### Test in Console:

```javascript
// Open browser console and run:
const socket = io({ path: "/api/socket" });

socket.on("connect", () => {
  console.log("✅ Connected!", socket.id);
});

socket.emit("admin:subscribe");

socket.on("order:new", (data) => {
  console.log("🆕 New order:", data);
});
```

---

## 🎯 Quick Commands Reference

```bash
# Build once (required first time)
npm run build

# Start with WebSocket
npm start

# Or use this for development with WebSocket:
npm run dev:socket

# For fast development without WebSocket:
npm run dev
```

---

## 🐛 Troubleshooting

### Error: "Port 3002 already in use"
```bash
npm run kill-port
npm start
```

### Error: "Cannot find socket-server.js"
```bash
# You forgot to build!
npm run build
npm start
```

### WebSocket not connecting
1. Check server logs for: `✅ Socket.IO server initialized`
2. If missing, rebuild: `npm run build`
3. Check browser console for connection errors

---

## 📊 What's Working Now?

After activation:

✅ WebSocket server on port 3002
✅ Real-time bidirectional communication
✅ Admin can receive live notifications
✅ Customers can track orders in real-time
✅ Stock updates broadcast to all clients
✅ Connection recovery on disconnect

---

## 🎉 You're Done!

After these 3 steps, your e-commerce site will have:

- ⚡ Real-time order notifications
- 📦 Live order tracking
- 🔔 Instant admin alerts
- 📊 Live dashboard updates
- 🟢 Connection status monitoring

---

## 🇧🇩 বাংলা নির্দেশিকা

### ধাপ ১: Build করুন

```bash
Ctrl+C           # Server বন্ধ করুন
npm run build    # Build করুন (২-৩ মিনিট)
```

### ধাপ ২: Server চালু করুন

```bash
npm start
```

**দেখবেন:**
```
✅ Socket.IO server initialized
> WebSocket server ready on /api/socket
```

### ধাপ ৩: Component যোগ করুন

`app/[locale]/admin/layout.tsx` ফাইলে এই লাইন যোগ করুন:

```typescript
<AdminRealtimeNotifications />
```

### ✅ সম্পূর্ণ!

এখন admin dashboard এ নতুন order আসলে real-time notification পাবেন! 🎉

**Test করুন:**
1. Admin dashboard খুলুন
2. একটি order করুন
3. Real-time notification দেখুন!

---

**Questions?** Check `WEBSOCKET_QUICKSTART.md` for more details.
