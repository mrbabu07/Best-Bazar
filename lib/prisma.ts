import { PrismaClient, type Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Optimizes DATABASE_URL for Neon serverless connections
 * - Ensures pooler endpoint is used
 * - Removes problematic channel_binding parameter
 * - Sets optimal connection limits and timeouts
 */
function getPooledDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.hostname.endsWith(".neon.tech")) {
      // Ensure pooler endpoint is used
      if (!url.hostname.includes("-pooler.")) {
        const [endpoint, ...rest] = url.hostname.split(".");

        if (endpoint && rest.length) {
          url.hostname = `${endpoint}-pooler.${rest.join(".")}`;
        }
      }

      // Remove channel_binding (causes connection issues with pooler)
      url.searchParams.delete("channel_binding");

      // Set SSL mode
      url.searchParams.set("sslmode", url.searchParams.get("sslmode") ?? "require");
      
      // Optimize connection limits for serverless (increased from 1 to 10)
      url.searchParams.set(
        "connection_limit",
        url.searchParams.get("connection_limit") ?? process.env.DATABASE_CONNECTION_LIMIT ?? "10"
      );
      
      // Set reasonable timeouts
      url.searchParams.set(
        "pool_timeout",
        url.searchParams.get("pool_timeout") ?? process.env.DATABASE_POOL_TIMEOUT ?? "20"
      );
      url.searchParams.set(
        "connect_timeout",
        url.searchParams.get("connect_timeout") ?? process.env.DATABASE_CONNECT_TIMEOUT ?? "10"
      );
      
      // Add pgbouncer mode for connection pooling
      url.searchParams.set("pgbouncer", "true");
    }

    return url.toString();
  } catch {
    return value;
  }
}

const prismaOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  // Prevent connection exhaustion in serverless
  datasources: undefined
};

const pooledDatabaseUrl = getPooledDatabaseUrl();

if (pooledDatabaseUrl) {
  prismaOptions.datasources = {
    db: {
      url: pooledDatabaseUrl
    }
  };
}

/**
 * Singleton Prisma Client instance
 * - Reuses single connection across all requests
 * - Prevents connection pool exhaustion
 * - Dev mode: stores in global to survive hot reloads
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Retry helper for handling transient connection errors
 * Use this wrapper for critical queries that should retry on connection reset
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  delayMs = 100
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Only retry on connection-related errors
      const isConnectionError = 
        errorMessage.includes("Connection") ||
        errorMessage.includes("ECONNRESET") ||
        errorMessage.includes("ETIMEDOUT") ||
        errorMessage.includes("Transaction failed");
      
      if (!isConnectionError || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
