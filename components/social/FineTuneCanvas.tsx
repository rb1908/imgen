'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check, Type, Image as ImageIcon, RotateCcw, X, Move } from 'lucide-react';

// Simplified Overlay Interface
interface Overlay {
    id: string;
    type: 'text' | 'image';
    content: string; // Text string or Image URL
    x: number;
    y: number;
    scale: number;
    style?: string; // For text presets
}

interface FineTuneCanvasProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    baseImage: string;
    onSave: (finalImage: string) => void;
}

const TEXT_PRESETS = [
    { id: 'modern', label: 'Modern', font: 'Inter, sans-serif', weight: '700', color: 'white', bg: 'black' },
    { id: 'classic', label: 'Classic', font: 'serif', weight: '600', color: 'white', bg: 'transparent', shadow: '0 2px 4px rgba(0,0,0,0.5)' },
    { id: 'bold', label: 'Bold', font: 'sans-serif', weight: '900', color: 'black', bg: 'white' },
];

export function FineTuneCanvas({ open, onOpenChange, baseImage, onSave }: FineTuneCanvasProps) {
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Mock Save
    const handleSave = () => {
        // In a real app, we'd use html2canvas or fabric.toDataURL here.
        // For V1, we'll just acknowledge the save and return the original (or a handled version)
        // Since we can't easily merge client-side layers to a single file without a library in this snippet,
        // We will assume the functionality is "visual only" for this prototype or returns original.
        onSave(baseImage);
        onOpenChange(false);
    };

    const addText = (presetId: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setOverlays([...overlays, {
            id,
            type: 'text',
            content: 'Double Click to Edit',
            x: 50, // Center %
            y: 50,
            scale: 1,
            style: presetId
        }]);
        setSelectedId(id);
    };

    const removeOverlay = (id: string) => {
        setOverlays(overlays.filter(o => o.id !== id));
        setSelectedId(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col md:flex-row gap-0 overflow-hidden bg-background">

                {/* 1. Canvas Area */}
                <div className="flex-1 bg-muted/50 relative overflow-hidden flex items-center justify-center p-8">
                    <div
                        ref={canvasRef}
                        className="relative shadow-2xl bg-white"
                        style={{ aspectRatio: '1/1', height: '100%', maxHeight: '500px' }}
                    >
                        {/* Base Image */}
                        <img src={baseImage} alt="Base" className="w-full h-full object-cover select-none pointer-events-none" />

                        {/* Overlays */}
                        {overlays.map(overlay => {
                            const preset = TEXT_PRESETS.find(p => p.id === overlay.style);
                            return (
                                <div
                                    key={overlay.id}
                                    className={`absolute cursor-move select-none group border-2 ${selectedId === overlay.id ? 'border-primary z-10' : 'border-transparent hover:border-blue-300'}`}
                                    style={{
                                        top: `${overlay.y}%`,
                                        left: `${overlay.x}%`,
                                        transform: `translate(-50%, -50%) scale(${overlay.scale})`,
                                    }}
                                    onClick={() => setSelectedId(overlay.id)}
                                >
                                    {overlay.type === 'text' && (
                                        <div
                                            className="px-4 py-2 text-xl whitespace-nowrap"
                                            style={{
                                                fontFamily: preset?.font,
                                                fontWeight: preset?.weight as any,
                                                color: preset?.color,
                                                backgroundColor: preset?.bg,
                                                textShadow: preset?.shadow
                                            }}
                                            contentEditable={selectedId === overlay.id}
                                            suppressContentEditableWarning
                                        >
                                            {overlay.content}
                                        </div>
                                    )}

                                    {selectedId === overlay.id && (
                                        <button
                                            className="absolute -top-3 -right-3 bg-destructive text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                                            onClick={(e) => { e.stopPropagation(); removeOverlay(overlay.id); }}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Simplified Toolbar */}
                <div className="w-full md:w-64 bg-background border-l flex flex-col">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-lg">Fine Tune</h3>
                        <p className="text-xs text-muted-foreground">Add text or stickers</p>
                    </div>

                    <ScrollArea className="flex-1 p-4 space-y-6">
                        {/* Text Tools */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Add Text</label>
                            <div className="grid grid-cols-1 gap-2">
                                {TEXT_PRESETS.map(preset => (
                                    <Button
                                        key={preset.id}
                                        variant="outline"
                                        className="justify-start h-12"
                                        onClick={() => addText(preset.id)}
                                    >
                                        <Type className="w-4 h-4 mr-2" />
                                        <span style={{ fontFamily: preset.font, fontWeight: preset.weight as any }}>
                                            {preset.label}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Image Tools */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Overlays</label>
                            <Button variant="outline" className="w-full justify-start" disabled>
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Upload Logo (Coming Soon)
                            </Button>
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t bg-muted/10 space-y-2">
                        <Button className="w-full" onClick={handleSave}>
                            <Check className="w-4 h-4 mr-2" /> Done
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
