import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ROLE_HOME: Record<string, string> = {
  INQUILINO: "/inquilino",
  INMOBILIARIA: "/inmobiliaria",
  ADMIN: "/admin",
};

const PROTECTED_PREFIXES = ["/inquilino", "/inmobiliaria", "/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtected && session) {
    const role = session.user.role as string;
    const home = ROLE_HOME[role];
    if (home && !pathname.startsWith(home)) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
