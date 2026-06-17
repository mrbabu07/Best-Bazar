import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { toJsonSafeValue } from "@/lib/safe-json";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "admin") {
    throw new ApiError("Admin access required", 403);
  }

  return session;
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(toJsonSafeValue(data), { status });
}

export function created(data: unknown) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.flatten()
      },
      { status: 422 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const fields = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "unique field";
      return NextResponse.json({ error: `Duplicate ${fields}. Please use a different SKU or slug.` }, { status: 409 });
    }
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function getSearchParam(request: Request, key: string) {
  const url = new URL(request.url);
  return url.searchParams.get(key) ?? undefined;
}

export function getPagination(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
