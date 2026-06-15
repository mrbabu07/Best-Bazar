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

export function middleware(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"]
};
