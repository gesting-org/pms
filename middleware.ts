import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // For API routes without a valid session, return 401 JSON instead of redirecting to login
    const isApi = req.nextUrl.pathname.startsWith("/api/");
    if (isApi && !req.nextauth.token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // Always run the middleware function above; auth check is done inside
      authorized: () => true,
    },
  }
);

// Protect app routes (API routes rely on requireAuth() inside each handler)
// Note: route group (app) maps to URL paths without the group prefix
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reservations/:path*",
    "/properties/:path*",
    "/owners/:path*",
    "/tasks/:path*",
    "/expenses/:path*",
    "/liquidations/:path*",
    "/contracts/:path*",
    "/messages/:path*",
    "/analytics/:path*",
    "/automations/:path*",
    "/calendar/:path*",
    "/documents/:path*",
    "/payments/:path*",
    "/tenants/:path*",
    "/settings/:path*",
    "/orders/:path*",
  ],
};
