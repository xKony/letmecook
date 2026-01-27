"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { UserPlus, User } from "lucide-react";

export function LoginScreen() {
    const { state, addUser, selectUser } = useApp();
    const [isCreating, setIsCreating] = useState(false);
    const [newUserName, setNewUserName] = useState("");

    const handleCreateUser = () => {
        if (newUserName.trim()) {
            addUser(newUserName.trim());
            setNewUserName("");
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleCreateUser();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">LetMeCook 🍳</h1>
                    <p className="text-muted-foreground">Active Recall Flashcards</p>
                </div>

                {/* Login Card */}
                <div className="bg-card rounded-3xl border border-border shadow-xl p-8">
                    <h2 className="text-xl font-semibold mb-6 text-center">Select Profile</h2>

                    {/* Existing Users */}
                    {state.users.length > 0 && (
                        <div className="space-y-3 mb-6">
                            {state.users.map((user) => (
                                <motion.button
                                    key={user.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => selectUser(user.id)}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="font-medium">{user.name}</span>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* Divider */}
                    {state.users.length > 0 && !isCreating && (
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-card text-muted-foreground">or</span>
                            </div>
                        </div>
                    )}

                    {/* Create New User */}
                    {isCreating ? (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-3"
                        >
                            <input
                                type="text"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter your name"
                                autoFocus
                                className="w-full p-4 rounded-xl bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleCreateUser} className="flex-1">
                                    Create
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewUserName("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setIsCreating(true)}
                            className="w-full gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            New Profile
                        </Button>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    Data is stored locally in your browser
                </p>
            </motion.div>
        </div>
    );
}
