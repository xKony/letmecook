"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { registerUser } from "@/app/actions/auth-actions";
import { signIn } from "next-auth/react";
import { useApp } from "@/lib/app-context";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, authLoading, authUser } = useApp();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            const from = searchParams.get("from") || "/";
            router.push(from);
            router.refresh();
        }
    }, [isAuthenticated, authLoading, router, searchParams]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const name = formData.get("name") as string;

        try {
            if (isLogin) {
                // Use client-side signIn for proper session handling
                const result = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });

                if (result?.error) {
                    setError("Invalid email or password");
                } else {
                    setSuccess("Login successful! Redirecting...");
                    // Force refresh to update session
                    router.refresh();
                    setTimeout(() => {
                        router.push("/");
                    }, 500);
                }
            } else {
                // Register user
                const result = await registerUser(formData);
                if (result?.error) {
                    setError(result.error);
                } else if (result?.success) {
                    // Auto-login after registration
                    const loginResult = await signIn("credentials", {
                        email,
                        password,
                        redirect: false,
                    });

                    if (loginResult?.error) {
                        setError("Account created but login failed. Please sign in.");
                        setIsLogin(true);
                    } else {
                        setSuccess("Account created! Redirecting...");
                        router.refresh();
                        setTimeout(() => {
                            router.push("/");
                        }, 500);
                    }
                }
            }
        } catch (err) {
            console.error("Auth error:", err);
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

    // Already logged in
    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <p className="text-lg">Welcome back, {authUser?.name || authUser?.email}!</p>
                    <p className="text-muted-foreground">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            🍳 LetMeCook
                        </h1>
                        <p className="text-muted-foreground">
                            {isLogin ? "Welcome back!" : "Create your account"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Name (optional)"
                                    className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                required
                                minLength={6}
                                className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-rose-400 text-sm text-center p-3 bg-rose-500/10 rounded-lg border border-rose-500/20"
                                >
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
                                    className="text-emerald-400 text-sm text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            type="submit"
                            disabled={isLoading || !!success}
                            className="w-full py-6 rounded-xl font-semibold"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? "Sign In" : "Create Account"}
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {isLogin
                                ? "Don't have an account? Sign up"
                                : "Already have an account? Sign in"}
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border text-center">
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Continue as guest →
                        </button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Guest data is stored locally and cannot be synced across devices.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
