import { NextRequest } from "next/server";

/**
 * Socket.IO endpoint
 * This is a placeholder - actual Socket.IO server runs in server.js
 */
export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({
      message: "Socket.IO server is running",
      path: "/api/socket",
      status: "active",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
