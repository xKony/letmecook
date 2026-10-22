import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReminderSettings, sendTestReminder } from "@/app/actions/reminder-actions";

export const dynamic = "force-dynamic";

/** Authenticated: fetch my pairing topic + enabled flag. */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const settings = await getReminderSettings();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load settings" },
            { status: 500 },
        );
    }
}

/** Authenticated: publish a test notification to my topic. */
export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        await sendTestReminder();
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to send test" },
            { status: 500 },
        );
    }
}
