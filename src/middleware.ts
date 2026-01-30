export { auth as middleware } from "@/lib/auth";

// Configure which routes require authentication
export const config = {
    matcher: [
        // Protect API routes except auth endpoints
        "/api/((?!auth).*)",
        // Optional: protect specific pages
        // "/dashboard/:path*",
    ],
};
