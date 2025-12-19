import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Check for the token in cookies (set by our auth lib mirror)
    const token = request.cookies.get("krypton_token");

    const isAuthPage =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register");

    const isProtected =
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/workouts") ||
        request.nextUrl.pathname.startsWith("/settings");

    if (isProtected && !token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAuthPage && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/workouts/:path*", "/settings/:path*", "/login", "/register"],
};
