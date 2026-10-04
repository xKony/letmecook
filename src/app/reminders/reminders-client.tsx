"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NtfySetup } from "@/components/reminders/ntfy-setup";

export function RemindersClient() {
    const router = useRouter();

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Reminders</h1>
                    </div>
                </div>
                <NtfySetup />
            </div>
        </div>
    );
}
