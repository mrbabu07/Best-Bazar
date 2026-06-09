import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const locales = ["en", "ar"] as const;

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    PUBLIC_FILE.test(pathname)
  );
}

function getPreferredLocale(request: NextRequest) {
  const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
  return locales.includes(localeCookie as (typeof locales)[number]) ? localeCookie : "en";
}

function getPathLocale(pathname: string) {
  return locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

function withoutLocale(pathname: string, locale: string) {
  const stripped = pathname.replace(new RegExp(`^/${locale}`), "");
  return stripped || "/";
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const pathLocale = getPathLocale(pathname);

  if (!pathLocale) {
    const locale = getPreferredLocale(request);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname}`;

    return NextResponse.redirect(redirectUrl);
  }

  const normalizedPath = withoutLocale(pathname, pathLocale);

  if (isAdminPath(normalizedPath)) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });
      const role = (token as { role?: string } | null)?.role;

      if (role === "admin") {
        return NextResponse.next();
      }
    } catch {
      // Missing or invalid auth configuration should fail closed for admin pages.
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${pathLocale}/login`;
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
