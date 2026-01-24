import { useCanvasStore } from '@/lib/canvas/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function TextPresetsPanel() {
    const { dispatch } = useCanvasStore();

    // Group presets by category
    const presetGroups = {
        'Basics': [
            { label: 'Heading', text: 'Add a heading', style: { fontFamily: 'Inter', fontSize: 60, fontWeight: 'bold' } },
            { label: 'Subheading', text: 'Add a subheading', style: { fontFamily: 'Inter', fontSize: 40, fontWeight: '500' } },
            { label: 'Body', text: 'Add a little bit of body text', style: { fontFamily: 'Inter', fontSize: 24, fontWeight: 'normal' } },
        ],
        'Fancy': [
            { label: 'Script', text: 'Feeling Fancy', style: { fontFamily: 'Great Vibes', fontSize: 80, fill: '#ec4899' } },
            { label: 'Retro', text: 'Stay Groovy', style: { fontFamily: 'Pacifico', fontSize: 60, fill: '#f97316' } },
            { label: 'Elegant', text: 'Refined Elegance', style: { fontFamily: 'Playfair Display', fontSize: 50, fontStyle: 'italic', fill: '#4b5563' } },
        ],
        'Bold & Graphic': [
            { label: 'Bold', text: 'BE BOLD', style: { fontFamily: 'Bebas Neue', fontSize: 90, fill: '#000000' } },
            { label: 'Comic', text: 'Comic Book', style: { fontFamily: 'Bangers', fontSize: 80, fill: '#ef4444', stroke: 'black', strokeWidth: 2 } },
            { label: 'Tech', text: 'CYBERPUNK', style: { fontFamily: 'Orbitron', fontSize: 50, fill: '#22d3ee', shadowColor: '#22d3ee', shadowBlur: 10 } },
            { label: 'Code', text: 'console.log("Hello")', style: { fontFamily: 'Roboto Mono', fontSize: 30, fill: '#16a34a', backgroundColor: '#000' } },
        ]
    };

    const handleAddPreset = (preset: any) => {
        dispatch({
            type: 'ADD_TEXT',
            content: preset.text,
            x: 540,
            y: 540,
            style: {
                ...preset.style,
                align: 'center',
            }
        });
    };

    return (
        <div className="h-full flex flex-col bg-white text-neutral-900 border-r border-neutral-200">
            <div className="p-4 border-b border-neutral-200">
                <h3 className="font-semibold text-sm">Text Presets</h3>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4">
                    <div className="flex flex-col gap-2 mb-6">
                        {presetGroups['Basics'].map((preset, i) => (
                            <button
                                key={i}
                                className="w-full text-left p-3 rounded-md hover:bg-neutral-100 transition-colors border border-neutral-200 hover:border-neutral-300 group"
                                onClick={() => handleAddPreset(preset)}
                            >
                                <div style={{ fontSize: Math.min((preset.style.fontSize as number) / 2, 24), fontWeight: preset.style.fontWeight, fontFamily: preset.style.fontFamily }}>
                                    {preset.label}
                                </div>
                            </button>
                        ))}
                    </div>

                    <Accordion type="multiple" defaultValue={['Fancy', 'Bold & Graphic']} className="w-full">
                        {Object.entries(presetGroups).map(([category, items]) => {
                            if (category === 'Basics') return null;
                            return (
                                <AccordionItem key={category} value={category} className="border-b-0">
                                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">{category}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="flex flex-col gap-2 pt-2">
                                            {items.map((preset: any, i) => (
                                                <button
                                                    key={i}
                                                    className="w-full text-left p-4 rounded-md bg-neutral-50 hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
                                                    onClick={() => handleAddPreset(preset)}
                                                >
                                                    <div
                                                        style={{
                                                            fontFamily: preset.style?.fontFamily,
                                                            fontSize: Math.min((preset.style?.fontSize as number) || 20, 28),
                                                            fontWeight: preset.style?.fontWeight,
                                                            fontStyle: preset.style?.fontStyle,
                                                            color: preset.style?.fill || 'black',
                                                            textShadow: preset.style?.shadowBlur ? `0 0 ${preset.style.shadowBlur}px ${preset.style.shadowColor}` : undefined,
                                                            WebkitTextStroke: preset.style?.stroke ? `1px ${preset.style.stroke}` : undefined
                                                        }}
                                                        className="preview-text truncate text-center"
                                                    >
                                                        {preset.text}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
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
