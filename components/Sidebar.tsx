"use client";

import { LayoutDashboard, Image as ImageIcon, Settings, PlusCircle, Sparkles, ChevronLeft, ChevronRight, Palette, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Sparkles, label: 'Generations', href: '/generations' },
    { icon: Palette, label: 'Templates', href: '/templates' },
    { icon: ShoppingBag, label: 'Shopify Import', href: '/shopify-import' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar({ isCollapsed, toggleSidebar }: { isCollapsed: boolean; toggleSidebar: () => void }) {
    const pathname = usePathname();

    return (
        <div
            className={cn(
                "border-r border-border h-screen bg-card fixed left-0 top-0 transition-[width] duration-300 ease-in-out z-20 hidden md:flex flex-col",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header / Toggle */}
            <div className={cn("flex items-center mb-8 mt-4 px-4", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">ImageForge</span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mb-2">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                )}
            </div>

            {/* Toggle Button Absolute on border */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-6 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center hover:bg-accent text-muted-foreground z-30"
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            <nav className="space-y-1 px-3">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                isCollapsed ? "justify-center px-2" : ""
                            )}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}

                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-50">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto p-4">
                {!isCollapsed ? (
                    <div className="bg-accent/50 rounded-xl p-4 overflow-hidden">
                        <h4 className="font-medium text-sm mb-1 whitespace-nowrap">Pro Plan</h4>
                        <p className="text-xs text-muted-foreground mb-3 whitespace-nowrap">500 generations left</p>
                        <button className="w-full bg-primary text-primary-foreground text-xs font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap">
                            Upgrade
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center text-xs font-bold text-muted-foreground cursor-pointer" title="Pro Plan">
                            P
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
