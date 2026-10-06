// apps/web/proxy.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEnv } from "@/lib/env";
import { AccessError, requireRole, routeRoles } from "@/lib/rbac";
import { safeReturnTo } from "@/lib/return-to";

// The Auth.js wrapper writes refreshed cookies on this response, including redirects.
export const proxy = auth((request) => {
  const required = routeRoles(request.nextUrl.pathname);
  if (!required) return NextResponse.next();
  try {
    requireRole(request.auth, required);
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    if (!(error instanceof AccessError)) throw error;
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    const origin = getEnv().AUTH_URL;
    if (error.status === 403) {
      return NextResponse.rewrite(new URL("/403", origin), { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    const target = new URL(error.code === "SessionExpired" ? "/session-expired" : "/login", origin);
    target.searchParams.set("returnTo", safeReturnTo(request.nextUrl.pathname));
    return NextResponse.redirect(target);
  }
});

export const config = { matcher: ["/dashboard/:path*", "/editor/:path*", "/admin/:path*", "/api/admin/:path*"] };
