"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { registerUser, loginUser } from "@/app/actions/auth-actions";

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                const result = await loginUser(formData);
                if (result?.error) {
                    setError(result.error);
                }
            } else {
                const result = await registerUser(formData);
                if (result?.error) {
                    setError(result.error);
                } else if (result?.success) {
                    // Auto-login after registration
                    await loginUser(formData);
                }
            }
        } catch {
            // Redirect errors are expected for successful login
            router.push("/");
        } finally {
            setIsLoading(false);
        }
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

                    <form action={handleSubmit} className="space-y-4">
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

                        {error && (
                            <div className="text-rose-500 text-sm text-center p-2 bg-rose-500/10 rounded-lg">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
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
