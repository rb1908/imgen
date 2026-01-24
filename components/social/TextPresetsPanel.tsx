'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Preset {
    label: string;
    text: string;
    style: any;
}

interface PresetGroup {
    category: string;
    items: Preset[];
    layout?: 'list' | 'grid';
}

export function TextPresetsPanel() {
    const { dispatch } = useCanvasStore();

    // Organized Preset Groups
    const presetGroups: PresetGroup[] = [
        {
            category: 'Basics',
            layout: 'list',
            items: [
                { label: 'Heading', text: 'Add a heading', style: { fontFamily: 'Inter', fontSize: 60, fontWeight: 'bold' } },
                { label: 'Subheading', text: 'Add a subheading', style: { fontFamily: 'Inter', fontSize: 40, fontWeight: '500' } },
                { label: 'Body', text: 'Add a little bit of body text', style: { fontFamily: 'Inter', fontSize: 24, fontWeight: 'normal' } },
            ]
        },
        {
            category: 'Fancy',
            layout: 'grid',
            items: [
                { label: 'Script', text: 'Feeling Fancy', style: { fontFamily: 'Great Vibes', fontSize: 80, fill: '#ec4899' } },
                { label: 'Retro', text: 'Stay Groovy', style: { fontFamily: 'Pacifico', fontSize: 60, fill: '#f97316' } },
                { label: 'Bold', text: 'BE BOLD', style: { fontFamily: 'Bebas Neue', fontSize: 90, fill: '#000000' } },
                { label: 'Comic', text: 'Comic Book', style: { fontFamily: 'Bangers', fontSize: 80, fill: '#ef4444', stroke: 'black', strokeWidth: 2 } },
                { label: 'Tech', text: 'CYBERPUNK', style: { fontFamily: 'Orbitron', fontSize: 50, fill: '#22d3ee', shadowColor: '#22d3ee', shadowBlur: 10 } },
                { label: 'Elegant', text: 'Refined Elegance', style: { fontFamily: 'Playfair Display', fontSize: 50, fontStyle: 'italic', fill: '#4b5563' } },
                { label: 'Code', text: 'console.log("Hello")', style: { fontFamily: 'Roboto Mono', fontSize: 30, fill: '#16a34a', backgroundColor: '#000' } },
            ]
        }
    ];

    const handleAddPreset = (preset: any) => {
        dispatch({
            type: 'ADD_TEXT',
            content: preset.text,
            x: 540, // Should use viewport center in reality
            y: 540,
            style: {
                ...preset.style,
                align: 'center',
            }
        });
    };

    return (
        <div className="h-full flex flex-col p-4 bg-neutral-900 text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Type className="w-4 h-4 text-neutral-400" />
                Text
            </h3>
            <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="flex flex-col gap-2">
                    {presetGroups.map((group, i) => (
                        <CollapsibleSection key={i} title={group.category} defaultOpen={true}>
                            <div className={cn(
                                "pt-2",
                                group.layout === 'grid' ? "grid grid-cols-2 gap-2" : "flex flex-col gap-3"
                            )}>
                                {group.items.map((preset, j) => (
                                    <button
                                        key={j}
                                        className={cn(
                                            "w-full text-left p-3 rounded hover:bg-neutral-800 transition-colors border border-neutral-800 hover:border-neutral-700 group relative overflow-hidden bg-neutral-950/30",
                                            group.layout === 'grid' ? "h-24 flex items-center justify-center p-2 text-center" : ""
                                        )}
                                        onClick={() => handleAddPreset(preset)}
                                    >
                                        <div
                                            style={{
                                                fontFamily: preset.style?.fontFamily,
                                                fontSize: group.layout === 'grid' ? Math.min((preset.style?.fontSize as number) || 20, 20) : Math.min((preset.style?.fontSize as number) || 20, 24),
                                                fontWeight: preset.style?.fontWeight,
                                                fontStyle: preset.style?.fontStyle,
                                                color: preset.style?.fill || 'white',
                                                textShadow: preset.style?.shadowBlur ? `0 0 ${preset.style.shadowBlur}px ${preset.style.shadowColor}` : undefined,
                                                WebkitTextStroke: preset.style?.stroke ? `0.5px ${preset.style.stroke}` : undefined
                                            }}
                                            className={cn("preview-text w-full", group.layout === 'grid' ? "break-words leading-tight" : "truncate")}
                                        >
                                            {preset.text}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CollapsibleSection>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-neutral-800 pb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-2 text-xs font-bold text-neutral-500 uppercase hover:text-white transition-colors"
            >
                {title}
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isOpen && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}

// Note: In a real app we would want `dispatch` to accept specific style overrides in 'ADD_TEXT'
// My generic ADD_TEXT command might need update if it doesn't support generic style payload.
// Let's verify 'ADD_TEXT' command structure in strict checking.
// It accepts `style?: string`. Ah, looking at `commands.ts`, it seems `ADD_TEXT` takes `style?: string` on line 15.
// But in implementation (line 49): `style: { fontSize: 40... }`. It sets hardcoded defaults!
// I need to update `ADD_TEXT` to accept an object for `style`.
