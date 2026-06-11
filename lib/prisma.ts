import { PrismaClient, type Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getPooledDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.hostname.endsWith(".neon.tech")) {
      if (!url.hostname.includes("-pooler.")) {
        const [endpoint, ...rest] = url.hostname.split(".");

        if (endpoint && rest.length) {
          url.hostname = `${endpoint}-pooler.${rest.join(".")}`;
        }
      }

      url.searchParams.set("sslmode", url.searchParams.get("sslmode") ?? "require");
      url.searchParams.set(
        "connection_limit",
        url.searchParams.get("connection_limit") ?? process.env.DATABASE_CONNECTION_LIMIT ?? "5"
      );
      url.searchParams.set(
        "pool_timeout",
        url.searchParams.get("pool_timeout") ?? process.env.DATABASE_POOL_TIMEOUT ?? "20"
      );
      url.searchParams.set(
        "connect_timeout",
        url.searchParams.get("connect_timeout") ?? process.env.DATABASE_CONNECT_TIMEOUT ?? "10"
      );
    }

    return url.toString();
  } catch {
    return value;
  }
}

const prismaOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
};
const pooledDatabaseUrl = getPooledDatabaseUrl();

if (pooledDatabaseUrl) {
  prismaOptions.datasources = {
    db: {
      url: pooledDatabaseUrl
    }
  };
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
