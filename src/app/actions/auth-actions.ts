"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { getClientIP } from "@/lib/get-client-ip";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
    registerSchema,
    changePasswordSchema,
    changeNameSchema,
} from "@/lib/validations";

export async function registerUser(formData: FormData) {
    // Rate limiting
    const ip = await getClientIP();
    const rateLimit = await checkRateLimit(`register:${ip}`, RATE_LIMITS.register);
    if (!rateLimit.success) {
        return { error: `Too many registration attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.` };
    }

    const validation = registerSchema.safeParse({
        name: (formData.get("name") as string) || undefined,
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validation.success) {
        return { error: validation.error.issues[0]?.message || "Invalid input" };
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        return { error: "Email already registered" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    try {
        await db.insert(users).values({
            name: name || null,
            email,
            password: hashedPassword,
        });

        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Failed to create account" };
    }
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Rate limiting (by user ID for authenticated users)
    const rateLimit = await checkRateLimit(`password:${session.user.id}`, RATE_LIMITS.passwordChange);
    if (!rateLimit.success) {
        return { error: `Too many password change attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.` };
    }

    const validation = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!validation.success) {
        return { error: validation.error.issues[0]?.message || "Invalid input" };
    }

    try {
        // Get current user with password
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
        });

        if (!user || !user.password) {
            return { error: "User not found or no password set" };
        }

        // Verify current password
        const isValid = await bcrypt.compare(validation.data.currentPassword, user.password);

        if (!isValid) {
            return { error: "Current password is incorrect" };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(validation.data.newPassword, 12);

        // Update password
        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, session.user.id));

        return { success: true };
    } catch (error) {
        console.error("Password change error:", error);
        return { error: "Failed to change password" };
    }
}

export async function changeName(newName: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    const validation = changeNameSchema.safeParse({ name: newName });
    if (!validation.success) {
        return { error: validation.error.issues[0]?.message || "Invalid input" };
    }

    try {
        await db.update(users)
            .set({ name: validation.data.name })
            .where(eq(users.id, session.user.id));

        return { success: true };
    } catch (error) {
        console.error("Name change error:", error);
        return { error: "Failed to change name" };
    }
}
