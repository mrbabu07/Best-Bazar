"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "./socket-server";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      path: "/api/socket",
      autoConnect: false,
    });
  }
  return socket;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = getSocket();

    function onConnect() {
      setIsConnected(true);
      console.log("✅ Connected to WebSocket");
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log("❌ Disconnected from WebSocket");
    }

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);

    socketInstance.connect();

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.disconnect();
    };
  }, []);

  return { socket: getSocket(), isConnected };
}

// Hook for admin real-time updates
export function useAdminSocket() {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<{
    newOrders: number;
    statusUpdates: number;
  }>({ newOrders: 0, statusUpdates: 0 });

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to admin updates
    socket.emit("admin:subscribe");

    function onNewOrder(data: { orderId: string; orderNumber: string; total: number }) {
      console.log("🆕 New order:", data);
      setNotifications((prev) => ({ ...prev, newOrders: prev.newOrders + 1 }));
    }

    function onOrderStatusUpdate(data: { orderId: string; status: string }) {
      console.log("📦 Order status updated:", data);
      setNotifications((prev) => ({ ...prev, statusUpdates: prev.statusUpdates + 1 }));
    }

    socket.on("order:new", onNewOrder);
    socket.on("order:statusUpdate", onOrderStatusUpdate);

    return () => {
      socket.emit("admin:unsubscribe");
      socket.off("order:new", onNewOrder);
      socket.off("order:statusUpdate", onOrderStatusUpdate);
    };
  }, [socket, isConnected]);

  return { socket, isConnected, notifications };
}

// Hook for tracking specific order
export function useOrderTracking(orderId: string | null) {
  const { socket, isConnected } = useSocket();
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !orderId) return;

    socket.emit("order:track", orderId);

    function onOrderStatusUpdate(data: { orderId: string; status: string }) {
      if (data.orderId === orderId) {
        setOrderStatus(data.status);
      }
    }

    socket.on("order:statusUpdate", onOrderStatusUpdate);

    return () => {
      socket.off("order:statusUpdate", onOrderStatusUpdate);
    };
  }, [socket, isConnected, orderId]);

  return { orderStatus, isConnected };
}

// Hook for real-time stock updates
export function useStockUpdates(productId: string | null) {
  const { socket, isConnected } = useSocket();
  const [stock, setStock] = useState<number | null>(null);

  useEffect(() => {
    if (!isConnected || !productId) return;

    function onStockUpdate(data: { productId: string; stock: number }) {
      if (data.productId === productId) {
        setStock(data.stock);
      }
    }

    socket.on("stock:update", onStockUpdate);

    return () => {
      socket.off("stock:update", onStockUpdate);
    };
  }, [socket, isConnected, productId]);

  return { stock, isConnected };
}
