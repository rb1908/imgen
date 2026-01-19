
import { LayoutShell } from "@/components/LayoutShell";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LayoutShell>
            {children}
        </LayoutShell>
    );
}
