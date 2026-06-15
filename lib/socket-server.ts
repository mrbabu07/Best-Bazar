import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export type ServerToClientEvents = {
  "order:new": (data: { orderId: string; orderNumber: string; total: number }) => void;
  "order:statusUpdate": (data: { orderId: string; status: string }) => void;
  "stock:update": (data: { productId: string; stock: number }) => void;
  "notification:new": (data: { type: string; message: string; count: number }) => void;
};

export type ClientToServerEvents = {
  "admin:subscribe": () => void;
  "admin:unsubscribe": () => void;
  "order:track": (orderId: string) => void;
};

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export function initSocketServer(httpServer: HTTPServer) {
  if (io) {
    console.log("Socket.IO server already initialized");
    return io;
  }

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3002",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Admin subscribes to real-time updates
    socket.on("admin:subscribe", () => {
      socket.join("admins");
      console.log(`Admin ${socket.id} subscribed to updates`);
    });

    socket.on("admin:unsubscribe", () => {
      socket.leave("admins");
      console.log(`Admin ${socket.id} unsubscribed`);
    });

    // Track specific order
    socket.on("order:track", (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`Client ${socket.id} tracking order ${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.IO server initialized");
  return io;
}

export function getSocketServer() {
  if (!io) {
    throw new Error("Socket.IO server not initialized. Call initSocketServer first.");
  }
  return io;
}

// Helper functions to emit events
export function emitNewOrder(orderId: string, orderNumber: string, total: number) {
  if (io) {
    io.to("admins").emit("order:new", { orderId, orderNumber, total });
  }
}

export function emitOrderStatusUpdate(orderId: string, status: string) {
  if (io) {
    // Notify admins
    io.to("admins").emit("order:statusUpdate", { orderId, status });
    // Notify order tracker
    io.to(`order:${orderId}`).emit("order:statusUpdate", { orderId, status });
  }
}

export function emitStockUpdate(productId: string, stock: number) {
  if (io) {
    io.emit("stock:update", { productId, stock });
  }
}

export function emitNotification(type: string, message: string, count: number) {
  if (io) {
    io.to("admins").emit("notification:new", { type, message, count });
  }
}
