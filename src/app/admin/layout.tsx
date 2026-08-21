import { requireAdminUser } from "@/lib/auth-guards";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdminUser();
    return children;
}
