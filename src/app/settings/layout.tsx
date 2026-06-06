import { requireAuthenticatedUser } from "@/lib/auth-guards";

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuthenticatedUser("/settings");
    return children;
}
