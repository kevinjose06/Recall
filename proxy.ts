import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth proxy (formerly middleware).
 * Protected routes:  /dashboard/*, /events/*
 * Auth redirect:     /login — bounce away if already authenticated
 * Public routes:     /respond/*, /api/*, everything else
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Firebase auth sets a __session cookie when we login
  const sessionCookie = request.cookies.get("__session")?.value;
  const isAuthenticated = !!sessionCookie;

  // ── Protect member portal ──
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/events");

  if (isProtected && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect authenticated users away from /login ──
  if (pathname === "/login" && isAuthenticated) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)",
  ],
};
