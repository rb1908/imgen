'use client';

import { useCanvasStore } from '@/lib/canvas/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TextPresetsPanel() {
    const { dispatch } = useCanvasStore();

    // Preset configurations
    // These match the Google Fonts we loaded in layout.tsx
    const presets = [
        { label: 'Heading', text: 'Add a heading', style: { fontFamily: 'Inter', fontSize: 60, fontWeight: 'bold' } },
        { label: 'Subheading', text: 'Add a subheading', style: { fontFamily: 'Inter', fontSize: 40, fontWeight: '500' } },
        { label: 'Body', text: 'Add a little bit of body text', style: { fontFamily: 'Inter', fontSize: 24, fontWeight: 'normal' } },

        { category: 'Fancy' },
        { label: 'Script', text: 'Feeling Fancy', style: { fontFamily: 'Great Vibes', fontSize: 80, fill: '#ec4899' } }, // Pink script
        { label: 'Retro', text: 'Stay Groovy', style: { fontFamily: 'Pacifico', fontSize: 60, fill: '#f97316' } }, // Orange retro
        { label: 'Bold', text: 'BE BOLD', style: { fontFamily: 'Bebas Neue', fontSize: 90, fill: '#000000' } }, // Black Condensed
        { label: 'Comic', text: 'Comic Book', style: { fontFamily: 'Bangers', fontSize: 80, fill: '#ef4444', stroke: 'black', strokeWidth: 2 } }, // Red Comic
        { label: 'Tech', text: 'CYBERPUNK', style: { fontFamily: 'Orbitron', fontSize: 50, fill: '#22d3ee', shadowColor: '#22d3ee', shadowBlur: 10 } }, // Neon Cyan
        { label: 'Elegant', text: 'Refined Elegance', style: { fontFamily: 'Playfair Display', fontSize: 50, fontStyle: 'italic', fill: '#4b5563' } },
        { label: 'Code', text: 'console.log("Hello")', style: { fontFamily: 'Roboto Mono', fontSize: 30, fill: '#16a34a', backgroundColor: '#000' } },
    ];

    const handleAddPreset = (preset: any) => {
        dispatch({
            type: 'ADD_TEXT',
            content: preset.text,
            x: 540,
            y: 540,
            style: {
                ...preset.style, // Spread the preset style (fontFamily, color, etc)
                // Ensure defaults for others
                align: 'center',
            }
        });
    };

    return (
        <div className="h-full flex flex-col p-4 bg-neutral-900 text-white">
            <h3 className="font-semibold mb-4">Text</h3>
            <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="flex flex-col gap-4">
                    {presets.map((preset, i) => {
                        if (preset.category) {
                            return <div key={i} className="text-xs font-bold text-neutral-500 uppercase mt-4 mb-2">{preset.category}</div>;
                        }

                        return (
                            <button
                                key={i}
                                className="w-full text-left p-3 rounded hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700 group"
                                onClick={() => handleAddPreset(preset)}
                            >
                                <div
                                    style={{
                                        fontFamily: preset.style?.fontFamily,
                                        fontSize: Math.min((preset.style?.fontSize as number) || 20, 32),
                                        fontWeight: preset.style?.fontWeight,
                                        fontStyle: preset.style?.fontStyle,
                                        color: preset.style?.fill || 'white',
                                        // Simple preview approximation for shadows/strokes since CSS != Canvas exactly
                                        textShadow: preset.style?.shadowBlur ? `0 0 ${preset.style.shadowBlur}px ${preset.style.shadowColor}` : undefined,
                                        WebkitTextStroke: preset.style?.stroke ? `1px ${preset.style.stroke}` : undefined
                                    }}
                                    className="preview-text truncate"
                                >
                                    {preset.text}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}

// Note: In a real app we would want `dispatch` to accept specific style overrides in 'ADD_TEXT'
// My generic ADD_TEXT command might need update if it doesn't support generic style payload.
// Let's verify 'ADD_TEXT' command structure in strict checking.
// It accepts `style?: string`. Ah, looking at `commands.ts`, it seems `ADD_TEXT` takes `style?: string` on line 15.
// But in implementation (line 49): `style: { fontSize: 40... }`. It sets hardcoded defaults!
// I need to update `ADD_TEXT` to accept an object for `style`.
