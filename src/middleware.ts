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

  // Signed in but no role yet — send to role selection
  if (session && !session.user.role && pathname !== "/register/role") {
    return NextResponse.redirect(new URL("/register/role", req.url));
  }

  if (isProtected && session?.user.role) {
    const home = ROLE_HOME[session.user.role];
    if (home && !pathname.startsWith(home)) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
