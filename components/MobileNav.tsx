'use client';

import { LayoutDashboard, Image as ImageIcon, Settings, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: 'Projects', href: '/' },
    { icon: Sparkles, label: 'Feed', href: '/generations' },
    { icon: ImageIcon, label: 'Templates', href: '/templates' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border p-1 md:hidden">
            <nav className="flex items-center justify-around">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center p-1 rounded-lg transition-all",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "p-1 rounded-full mb-0.5 transition-all",
                                isActive ? "bg-primary/10" : "bg-transparent"
                            )}>
                                <item.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
