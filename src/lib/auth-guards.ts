import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

function loginRedirect(from: string): never {
    redirect(`/login?from=${encodeURIComponent(from)}`);
}

/**
 * Require an authenticated session in Server Components / layouts.
 */
export async function requireAuthenticatedUser(from: string): Promise<Session> {
    const session = await auth();

    if (!session?.user?.id) {
        loginRedirect(from);
    }

    return session;
}

/**
 * Require an authenticated admin session in Server Components / layouts.
 */
export async function requireAdminUser(): Promise<Session> {
    const session = await requireAuthenticatedUser("/admin");
    const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin;

    if (!isAdmin) {
        redirect("/");
    }

    return session;
}
