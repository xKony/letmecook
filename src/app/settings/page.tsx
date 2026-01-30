"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { changePassword } from "@/app/actions/auth-actions";
import { useApp } from "@/lib/app-context";

export default function SettingsPage() {
    const router = useRouter();
    const { isAuthenticated, authLoading, authUser } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const currentPassword = formData.get("currentPassword") as string;
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword !== confirmPassword) {
            setError("New passwords don't match");
            setIsLoading(false);
            return;
        }

        try {
            const result = await changePassword(currentPassword, newPassword);

            if (result.error) {
                setError(result.error);
            } else {
                setSuccess("Password changed successfully!");
                // Clear form
                (e.target as HTMLFormElement).reset();
            }
        } catch (err) {
            console.error("Password change error:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Redirect if not authenticated
    if (!isAuthenticated) {
        router.push("/login?from=/settings");
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Account Settings</h1>
                        <p className="text-muted-foreground">{authUser?.email}</p>
                    </div>
                </div>

                {/* Password Change Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-6"
                >
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Change Password
                    </h2>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                required
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-rose-400 text-sm p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-2"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Success message */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-emerald-400 text-sm p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
