import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { STATIC_AUTH_COOKIE, isStaticAuthSession } from "@/lib/auth/static";

/**
 * Auth proxy (formerly middleware).
 * Renamed from middleware.ts per Next.js 16 — see proxy.md docs.
 *
 * Protected routes:  /dashboard/*, /events/*
 * Auth redirect:     /login — bounce away if already authenticated
 * Public routes:     /respond/*, /api/*, everything else
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always refresh the session to keep cookies alive.
  const { supabaseResponse, user } = await updateSession(request);

  const hasStaticSession = isStaticAuthSession(
    request.cookies.get(STATIC_AUTH_COOKIE)?.value
  );
  const isAuthenticated = !!user || hasStaticSession;

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

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico and public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)",
  ],
};
