import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.auth?.user;
    const isAdmin = (req.auth?.user as { isAdmin?: boolean } | undefined)?.isAdmin;

    if (pathname.startsWith("/settings") && !isLoggedIn) {
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) {
            const loginUrl = new URL("/login", req.nextUrl.origin);
            loginUrl.searchParams.set("from", pathname);
            return NextResponse.redirect(loginUrl);
        }
        if (!isAdmin) {
            return NextResponse.redirect(new URL("/", req.nextUrl.origin));
        }
    }

    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth") && !isLoggedIn) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
});

export const config = {
    matcher: [
        "/settings",
        "/settings/:path*",
        "/admin",
        "/admin/:path*",
        "/api/((?!auth).*)",
    ],
};
