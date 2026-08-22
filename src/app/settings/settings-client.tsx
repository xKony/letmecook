"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle, User } from "lucide-react";
import { changePassword, changeName } from "@/app/actions/auth-actions";
import { useApp } from "@/lib/app-context";
import { signOut } from "next-auth/react";

export function SettingsClient() {
    const router = useRouter();
    const { authUser } = useApp();

    // Password form state
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    // Name form state
    const [isNameLoading, setIsNameLoading] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [nameSuccess, setNameSuccess] = useState<string | null>(null);
    const [newName, setNewName] = useState(authUser?.name || "");

    async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);
        setIsPasswordLoading(true);

        const formData = new FormData(e.currentTarget);
        const currentPassword = formData.get("currentPassword") as string;
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords don't match");
            setIsPasswordLoading(false);
            return;
        }

        try {
            const result = await changePassword(currentPassword, newPassword);

            if (result.error) {
                setPasswordError(result.error);
            } else {
                setPasswordSuccess("Password changed successfully!");
                (e.target as HTMLFormElement).reset();
            }
        } catch (err) {
            console.error("Password change error:", err);
            setPasswordError("An unexpected error occurred");
        } finally {
            setIsPasswordLoading(false);
        }
    }

    async function handleNameChange(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setNameError(null);
        setNameSuccess(null);
        setIsNameLoading(true);

        try {
            const result = await changeName(newName);

            if (result.error) {
                setNameError(result.error);
            } else {
                setNameSuccess("Name updated! Please sign out and back in to see the change.");
            }
        } catch (err) {
            console.error("Name change error:", err);
            setNameError("An unexpected error occurred");
        } finally {
            setIsNameLoading(false);
        }
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-11 w-11 md:h-10 md:w-10" onClick={() => router.push("/")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-[1.4rem] sm:text-2xl font-bold tracking-tight">Account Settings</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">{authUser?.email}</p>
                    </div>
                </div>

                {/* Name Change Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-6"
                >
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Display Name
                    </h2>

                    <form onSubmit={handleNameChange} className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Your display name"
                                maxLength={50}
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <AnimatePresence>
                            {nameError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-rose-400 text-sm p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-2"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {nameError}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {nameSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-emerald-400 text-sm p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {nameSuccess}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            type="submit"
                            disabled={isNameLoading || newName === authUser?.name}
                            className="w-full h-11 sm:h-9 rounded-xl"
                        >
                            {isNameLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Update Name"
                            )}
                        </Button>
                    </form>
                </motion.div>

                {/* Password Change Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
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

                        <AnimatePresence>
                            {passwordError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-rose-400 text-sm p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-2"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {passwordError}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {passwordSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-emerald-400 text-sm p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {passwordSuccess}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            type="submit"
                            disabled={isPasswordLoading}
                            className="w-full h-11 sm:h-9 rounded-xl"
                        >
                            {isPasswordLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                </motion.div>

                {/* Sign Out Button */}
                <Button
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full h-11 sm:h-9 rounded-xl"
                >
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
