"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signIn, auth } from "@/lib/auth";

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        return { error: "Email already registered" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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

export async function loginUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/",
        });
        return { success: true };
    } catch (error) {
        // Handle redirect error (this is expected for successful login)
        if ((error as Error).message?.includes("NEXT_REDIRECT")) {
            throw error;
        }
        return { error: "Invalid credentials" };
    }
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    if (!currentPassword || !newPassword) {
        return { error: "Both passwords are required" };
    }

    if (newPassword.length < 6) {
        return { error: "New password must be at least 6 characters" };
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
        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            return { error: "Current password is incorrect" };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

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

