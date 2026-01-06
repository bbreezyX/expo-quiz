import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";

// Routes that require admin authentication
const PROTECTED_PAGES = ["/admin"];

// Public API routes (Allowlist)
const PUBLIC_API_ROUTES = [
  "/api/participant/join",
  "/api/participant/verify",
  "/api/answer/submit",
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/verify",
];

// Routes that should redirect to admin if already authenticated
const AUTH_PAGES = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a protected page (not login page)
  const isProtectedPage = PROTECTED_PAGES.some(
    (route) => pathname === route || (pathname.startsWith(route) && !pathname.startsWith("/admin/login"))
  );

  // Check if it's an API route that requires protection
  // Logic: Block ALL /api routes by default, except those in PUBLIC_API_ROUTES
  const isApiRoute = pathname.startsWith("/api");
  const isPublicApi = PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));
  const isProtectedApi = isApiRoute && !isPublicApi;

  // Check if it's an auth page (login)
  const isAuthPage = AUTH_PAGES.some((route) => pathname.startsWith(route));

  // Verify admin authentication
  const isAuthenticated = await verifyAdminRequest(request);

  // Redirect authenticated users away from login page
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Protect admin pages
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin API routes
  if (isProtectedApi && !isAuthenticated) {
    return NextResponse.json(
      { error: "Unauthorized - Login required" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all admin pages
    "/admin/:path*",
    // Match all API routes to run middleware logic
    "/api/:path*",
  ],
};

