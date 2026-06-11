import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const locales = ["en", "ar"] as const;
type Locale = (typeof locales)[number];

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    PUBLIC_FILE.test(pathname)
  );
}

function getPreferredLocale(request: NextRequest): Locale {
  const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
  return locales.includes(localeCookie as Locale) ? (localeCookie as Locale) : "en";
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

function isAccountPath(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/");
}

async function getAuthToken(request: NextRequest) {
  try {
    return getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest, locale: string, callbackUrl: string) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = `/${locale}/login`;
  loginUrl.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const pathLocale = getPathLocale(pathname);

  if (!pathLocale) {
    const locale = getPreferredLocale(request);

    if (isAdminPath(pathname)) {
      const token = await getAuthToken(request);
      const role = (token as { role?: string } | null)?.role;

      if (role !== "admin") {
        return redirectToLogin(request, locale, `/${locale}${pathname}${request.nextUrl.search}`);
      }
    }

    if (isAccountPath(pathname) && !(await getAuthToken(request))) {
      return redirectToLogin(request, locale, `/${locale}${pathname}${request.nextUrl.search}`);
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname}`;

    return NextResponse.redirect(redirectUrl);
  }

  const normalizedPath = withoutLocale(pathname, pathLocale);

  if (isAdminPath(normalizedPath)) {
    const token = await getAuthToken(request);
    const role = (token as { role?: string } | null)?.role;

    if (role === "admin") {
      return NextResponse.next();
    }

    return redirectToLogin(request, pathLocale, `${pathname}${request.nextUrl.search}`);
  }

  if (isAccountPath(normalizedPath) && !(await getAuthToken(request))) {
    return redirectToLogin(request, pathLocale, `${pathname}${request.nextUrl.search}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"]
};
