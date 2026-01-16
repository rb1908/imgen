'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelLeftOpen, Menu, LayoutDashboard, Sparkles, ShoppingBag, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { MobileNav } from '@/components/MobileNav'; // Removed
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from 'next/link';
import { LayoutProvider, useLayoutContext } from '@/components/LayoutContext';

function LayoutShellContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isSheetOpen, setIsSheetOpen } = useLayoutContext();
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

    const sidebarItems = [
        { icon: LayoutDashboard, label: 'Projects', href: '/projects' },
        { icon: Sparkles, label: 'Generations', href: '/generations' },
        { icon: ShoppingBag, label: 'Products', href: '/products' },
        { icon: Settings, label: 'Settings', href: '/settings' },
    ];

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

    return (
        <div className="flex h-screen w-screen max-w-[100vw] overflow-hidden bg-background relative">
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative max-w-full transition-[margin] duration-300 ease-in-out md:ml-64 data-[collapsed=true]:md:ml-20 ml-0" data-collapsed={isCollapsed}>

                {/* Global Navigation Sheet (Hidden Trigger, Controlled by Context) */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 z-[100]">
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                    <span className="font-bold text-lg tracking-tight">ImageForge</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto py-4">
                                <nav className="flex flex-col gap-1 px-2">
                                    {sidebarItems.map((item) => {
                                        const isActive = pathname.startsWith(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsSheetOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                )}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                {item.label}
                                            </Link>
                                        )
                                    })}
                                </nav>
                            </div>
                            <div className="p-4 border-t mt-auto">
                                <div className="bg-accent/50 rounded-xl p-4">
                                    <h4 className="font-medium text-sm mb-1">Pro Plan</h4>
                                    <p className="text-xs text-muted-foreground mb-3">500 generations left</p>
                                    <button className="w-full bg-primary text-primary-foreground text-xs font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors">
                                        Upgrade
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                <main className="flex-1 overflow-hidden relative w-full h-full pb-0 md:pb-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
    return (
        <LayoutProvider>
            <LayoutShellContent>{children}</LayoutShellContent>
        </LayoutProvider>
    );
}
