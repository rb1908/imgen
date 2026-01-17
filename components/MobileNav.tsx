
'use client';

import { LayoutDashboard, Image as ImageIcon, Settings, Sparkles, Palette, ShoppingBag } from 'lucide-react';
import { AIIcon } from './icons/AIIcon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';


const navItems = [
    { icon: LayoutDashboard, label: 'Projects', href: '/' },
    { icon: AIIcon, label: 'Gallery', href: '/generations' },
    { icon: ShoppingBag, label: 'Products', href: '/products' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function MobileNav() {
    const pathname = usePathname();

    const isMatch = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    // Logic moved to LayoutShell parent


    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden">
            <nav className="flex items-center gap-1 p-1.5 rounded-full bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl">
                {navItems.map((item) => {
                    const isActive = isMatch(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden",
                                isActive
                                    ? "bg-[#FF6B35] text-white pl-4 pr-5 py-3 gap-2"
                                    : "text-white/60 hover:text-white hover:bg-white/10 w-11 h-11"
                            )}
                        >
                            <item.icon className={cn("transition-transform", isActive ? "w-4 h-4" : "w-5 h-5")} />

                            <span className={cn(
                                "whitespace-nowrap font-medium text-sm transition-all duration-300 origin-left",
                                isActive ? "w-auto opacity-100 scale-100" : "w-0 opacity-0 scale-95 hidden"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

