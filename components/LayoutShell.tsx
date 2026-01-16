'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/MobileNav';
import { usePathname } from 'next/navigation';

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Optional: Load preference from localStorage
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved === 'true') setIsCollapsed(true);
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    if (!isMounted) {
        return (
            <div className="flex min-h-screen w-screen max-w-[100vw] overflow-hidden">
                {/* SSR/Loading state - default expanded to match server */}
                <div className="w-64 border-r border-border h-screen bg-card fixed left-0 top-0 hidden md:block" />
                <main className="flex-1 md:ml-64 ml-0 p-4 md:p-8 w-full max-w-full overflow-hidden">
                    {children}
                </main>
            </div>
        );
    }



    // ...

    const pathname = usePathname();
    // Hide on detail pages: /projects/xyz OR /products/xyz
    const isDetailPage = /^\/(projects|products)\/.+/.test(pathname || '');

    return (
        <div className="flex h-screen w-screen max-w-[100vw] overflow-hidden bg-background relative">
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
            <main
                className={cn(
                    "flex-1 transition-[margin] duration-300 ease-in-out h-full overflow-hidden relative max-w-full",
                    // Add bottom padding ONLY if nav is visible
                    !isDetailPage ? "pb-24 md:pb-8" : "pb-0 md:pb-8",
                    isCollapsed ? "md:ml-20" : "md:ml-64",
                    "ml-0" // Reset margin on mobile
                )}
            >
                {children}
            </main>
            {!isDetailPage && <MobileNav />}
        </div>
    );
}
