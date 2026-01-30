"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Cloud, HardDrive, LogIn } from "lucide-react";
import Link from "next/link";

export function GuestModeBanner() {
    const { data: session, status } = useSession();

    // Don't show banner if loading, logged in, or on login page
    if (status === "loading" || session) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2"
        >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-amber-200 text-sm">
                    <HardDrive className="w-4 h-4" />
                    <span>
                        <strong>Guest Mode:</strong> Data is stored locally on this device only.
                    </span>
                </div>
                <Link
                    href="/login"
                    className="flex items-center gap-2 text-sm bg-primary/20 hover:bg-primary/30 text-primary-foreground px-3 py-1 rounded-lg transition-colors"
                >
                    <Cloud className="w-4 h-4" />
                    <span>Sign in to sync</span>
                    <LogIn className="w-3 h-3" />
                </Link>
            </div>
        </motion.div>
    );
}
