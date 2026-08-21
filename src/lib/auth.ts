import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";
import { getClientIP } from "@/lib/get-client-ip";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const ADMIN_REFRESH_MS = 10 * 60_000;

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse({
                    email: credentials?.email,
                    password: credentials?.password,
                });

                if (!parsed.success) {
                    return null;
                }

                const ip = await getClientIP();
                const rateLimit = await checkRateLimit(`login:${ip}`, RATE_LIMITS.login);
                if (!rateLimit.success) {
                    return null;
                }

                const { email, password } = parsed.data;

                const user = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (!user || !user.password) {
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.password);

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    isAdmin: user.isAdmin,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
                token.isAdminCheckedAt = Date.now();
                return token;
            }

            if (token.id) {
                const checkedAt = typeof token.isAdminCheckedAt === "number"
                    ? token.isAdminCheckedAt
                    : 0;

                if (Date.now() - checkedAt > ADMIN_REFRESH_MS) {
                    const dbUser = await db.query.users.findFirst({
                        where: eq(users.id, token.id as string),
                        columns: { isAdmin: true },
                    });
                    token.isAdmin = dbUser?.isAdmin ?? false;
                    token.isAdminCheckedAt = Date.now();
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
                (session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin as boolean;
            }
            return session;
        },
    },
});
