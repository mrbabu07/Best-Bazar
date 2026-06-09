import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";

const sessionCookieNames = ["next-auth.session-token", "__Secure-next-auth.session-token"];

export function hasNextAuthSessionCookie(request?: Request) {
  if (request) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    return sessionCookieNames.some((name) => cookieHeader.includes(`${name}=`));
  }

  const cookieStore = cookies();
  return sessionCookieNames.some((name) => Boolean(cookieStore.get(name)));
}

export async function getOptionalServerSession(request?: Request) {
  if (!hasNextAuthSessionCookie(request)) {
    return null;
  }

  return getServerSession(authOptions);
}
