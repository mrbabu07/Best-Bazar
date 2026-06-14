# 🚀 WebSocket Quick Start Guide

## ✅ Server Status

Your WebSocket server is now running! 

```
✓ Server: http://localhost:3002
✓ Environment: development
⚠️ Socket.IO: Will initialize after first build
```

---

## 📋 Quick Commands

### Start Server:
```bash
# Start WebSocket server (auto-kills port 3002 first)
npm run dev:socket

# Or manually kill port first:
npm run kill-port
npm run dev:socket
```

### Build (Required for Socket.IO):
```bash
npm run build
npm start
```

---

## ⚠️ Important: First Time Setup

**Socket.IO requires build to initialize!**

The warning you see is normal for first run:
```
Socket.IO not initialized (will initialize after build)
```

**Solution:**
```bash
# 1. Stop current server
Ctrl+C

# 2. Build the app (generates socket-server.js)
npm run build

# 3. Start with WebSocket
npm start
```

**After build, Socket.IO will show:**
```
✅ Socket.IO server initialized
> WebSocket server ready on /api/socket
```

---

## 🎯 Development Workflow

### Option 1: Regular Development (No WebSocket)
```bash
npm run dev
```
- ✅ Fast hot reload
- ✅ Quick iterations
- ❌ No real-time features

**Use when:** Working on UI, styling, static features

### Option 2: WebSocket Development
```bash
npm run build      # Build first (one time)
npm run dev:socket # Or npm start
```
- ✅ Real-time features work
- ✅ Test WebSocket events
- ⏱️ Slower reload (manual restart needed)

**Use when:** Testing real-time features, order notifications, live tracking

---

## 🧪 Testing WebSocket

### 1. Build First:
```bash
npm run build
```

### 2. Start Server:
```bash
npm start
# Or: npm run dev:socket
```

### 3. Open Browser Console:
```javascript
// Test connection
const socket = io({ path: "/api/socket" });

socket.on("connect", () => {
  console.log("✅ Connected!", socket.id);
});

// Subscribe to admin updates
socket.emit("admin:subscribe");

// Listen for new orders
socket.on("order:new", (data) => {
  console.log("🆕 New order:", data);
});
```

### 4. Place Test Order:
- Visit: http://localhost:3002/en/shop
- Add product to cart
- Complete checkout
- Watch console for real-time event! ⚡

---

## 💡 When to Use What

### Use Regular Dev (`npm run dev`):
- Building new pages
- Styling components
- Working on static features
- Fast iteration needed

### Use WebSocket (`npm run dev:socket` or `npm start`):
- Testing order notifications
- Testing live tracking
- Demo real-time features
- Production-like testing

---

## 🔧 Troubleshooting

### Error: Port 3002 already in use
```bash
# Kill port automatically
npm run kill-port

# Or restart server (auto-kills port)
npm run dev:socket
```

**Note:** Port killing is now automatic! Scripts auto-kill port 3002 before starting.

### Error: Cannot find socket-server.js
```bash
# Build first!
npm run build
npm start
```

### WebSocket not connecting
```bash
# Check server logs
# Should see: "✅ Socket.IO server initialized"

# If not, rebuild:
npm run build
npm start
```

### Hot reload not working
```
This is expected with custom server!
Manual restart needed after code changes.

For fast iteration, use: npm run dev
```

---

## 📁 What's Happening

### Development (npm run dev):
```
Next.js Dev Server
├─ Hot Module Reload ✅
├─ Fast Refresh ✅
└─ WebSocket ❌
```

### Custom Server (npm run dev:socket / npm start):
```
Custom Node Server (server.js)
├─ Next.js App Router ✅
├─ Socket.IO WebSocket ✅
├─ Hot Reload ⏱️ (manual restart)
└─ Production-like ✅
```

---

## 🎨 Add Real-Time Features

### 1. Admin Notifications:

Edit `app/[locale]/admin/layout.tsx`:

```typescript
import { AdminRealtimeNotifications } from "@/components/admin/AdminRealtimeNotifications";

export default function AdminLayout({ children }) {
  return (
    <>
      {children}
      <AdminRealtimeNotifications />  {/* Add this line */}
    </>
  );
}
```

**What you get:**
- Toast notifications for new orders
- Live status update alerts
- Connection indicator

### 2. Order Tracking:

Edit order detail page:

```typescript
import { OrderTracker } from "@/components/order/OrderTracker";

<OrderTracker orderId={order.id} currentStatus={order.status} />
```

**What you get:**
- Real-time status updates
- No page refresh needed
- "Live" indicator

---

## 📊 Current Status

```
✓ WebSocket packages installed
✓ Server files created
✓ Client hooks ready
✓ Components built
✓ Server running on port 3002

⚠️ Next step: npm run build (to initialize Socket.IO)
```

---

## 🚀 Production Deployment

### Build:
```bash
npm run build
```

### Start:
```bash
npm start  # Uses server.js with WebSocket
```

### Deploy to:
- ✅ Railway
- ✅ Render
- ✅ DigitalOcean
- ✅ Your VPS
- ❌ Vercel/Netlify (no WebSocket support)

---

## 📚 Full Documentation

For complete guide, see: `WEBSOCKET_SETUP.md`

Includes:
- Detailed API reference
- All events documentation
- Advanced features
- Security best practices
- Production deployment
- Code examples

---

## ✅ Summary

**Current State:**
- ✅ Server running (http://localhost:3002)
- ⚠️ Socket.IO needs build to initialize
- ✅ All files created and ready

**Next Steps:**
1. Run `npm run build` (one time)
2. Run `npm start` to test WebSocket
3. Add real-time components to your pages
4. Test with actual orders

**Commands:**
```bash
# Development (no WebSocket, fast)
npm run dev

# Production-like (with WebSocket)
npm run build
npm start
```

---

**বাংলা দ্রুত নির্দেশিকা:**

**Server চলছে!** ✅

**WebSocket activate করতে:**
```bash
npm run build  # এক বার build করুন
npm start      # WebSocket সহ চালু হবে
```

**Development এর জন্য:**
```bash
npm run dev  # দ্রুত, WebSocket ছাড়া
```

**WebSocket test করতে:**
```bash
npm run build
npm start
# Browser console এ test করুন
```

**কখন কি use করবেন:**
- UI কাজ: `npm run dev` (fast)
- Real-time test: `npm start` (after build)

**খুব সহজ!** 🎉
