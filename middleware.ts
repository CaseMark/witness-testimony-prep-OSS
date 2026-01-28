/**
 * Next.js Middleware
 *
 * In the OSS version, authentication is handled client-side via localStorage.
 * This middleware is a pass-through that allows all routes.
 * Authentication checks happen in individual page components.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 *
 * This pattern excludes:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico
 * - public files (svg, png, jpg, etc.)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
