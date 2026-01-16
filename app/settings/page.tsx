import Link from 'next/link';
import { ChevronRight, Globe, Palette, User, Settings, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SettingsHub() {
    const filters = [
        {
            href: '/settings/integrations',
            title: 'Integrations',
            description: 'Connect Etsy, Shopify, and other platforms.',
            icon: Globe,
            color: 'bg-blue-500/10 text-blue-600',
        },
        {
            href: '/settings/looks',
            title: 'Saved Looks',
            description: 'Manage generation templates and styles.',
            icon: Palette,
            color: 'bg-purple-500/10 text-purple-600',
        },
        // Placeholder for future settings
        {
            href: '#',
            title: 'Account',
            description: 'Manage your profile and subscription.',
            icon: User,
            color: 'bg-orange-500/10 text-orange-600',
            disabled: true,
        },
        {
            href: '#',
            title: 'General',
            description: 'App preferences and defaults.',
            icon: Settings,
            color: 'bg-gray-500/10 text-gray-600',
            disabled: true,
        }
    ];

    return (
        <div className="max-w-xl mx-auto p-4 md:p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your preferences and connections.</p>
            </div>

            <div className="grid gap-4">
                {filters.map((item) => (
                    <Link
                        key={item.title}
                        href={item.disabled ? '#' : item.href}
                        className={cn(
                            "group relative flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200",
                            item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}
                    >
                        <div className={cn("p-3 rounded-lg", item.color)}>
                            <item.icon className="w-6 h-6" />
                        </div>

                        <div className="flex-1">
                            <h3 className="font-semibold text-base">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>
                ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-dashed flex items-center justify-between">
                <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Version</p>
                    <p className="text-sm font-medium">1.0.0 (Beta)</p>
                </div>
                <div className="text-xs text-muted-foreground">
                    Build 2026.01.16
                </div>
            </div>
        </div>
    );
}
