'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Check, Loader2, Wand2, Image as ImageIcon } from 'lucide-react';
import { SelectTemplatesDialog } from './SelectTemplatesDialog';
import { Template } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';

interface VisualCanvasProps {
    activeImage: string;
    onActiveImageChange: (url: string) => void;
    productImages: string[];
    generations: { id: string; url: string; prompt?: string }[];
    onGenerate: (mode: 'template' | 'custom', input: string[] | string) => Promise<void>;
    onAddToProduct: (url: string) => Promise<void>;
    templates: Template[];
    isGenerating: boolean;
}

export function VisualCanvas({
    activeImage,
    onActiveImageChange,
    productImages,
    generations,
    onGenerate,
    onAddToProduct,
    templates,
    isGenerating
}: VisualCanvasProps) {
    const [customPrompt, setCustomPrompt] = useState('');
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

    // Check if current active image is already in product images
    const isSaved = productImages.includes(activeImage);

    return (
        <div className="relative h-full flex flex-col bg-muted/30">
            {/* 1. Hero Canvas */}
            <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                <div className="relative w-full h-full max-h-[80vh] shadow-2xl rounded-xl overflow-hidden border bg-background flex items-center justify-center">
                    <Image
                        src={activeImage}
                        alt="Hero"
                        fill
                        className="object-contain" // Use contain to show full image, cover for full bleed. Contain is safer for product editing.
                    />

                    {/* Add to Listing Action (Overlay on Hero) */}
                    {!isSaved && (
                        <div className="absolute top-4 right-4 z-10">
                            <Button
                                onClick={() => onAddToProduct(activeImage)}
                                className="bg-white/90 text-black hover:bg-white shadow-lg backdrop-blur"
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add to Listing
                            </Button>
                        </div>
                    )}
                </div>

                {/* Floating Generation Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4">
                    <div className="bg-background/80 backdrop-blur-xl border shadow-xl rounded-full p-2 flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full shrink-0"
                            onClick={() => setIsTemplatePickerOpen(true)}
                        >
                            <Sparkles className={cn("w-5 h-5", selectedTemplateIds.length > 0 ? "text-primary fill-primary" : "text-muted-foreground")} />
                        </Button>

                        <Input
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Describe a change or choose a look..."
                            className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-10 px-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && customPrompt) {
                                    onGenerate('custom', customPrompt);
                                    setCustomPrompt('');
                                }
                            }}
                        />

                        <Button
                            size="icon"
                            className="rounded-full shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={isGenerating || (!customPrompt && selectedTemplateIds.length === 0)}
                            onClick={() => {
                                if (selectedTemplateIds.length > 0) {
                                    onGenerate('template', selectedTemplateIds);
                                } else {
                                    onGenerate('custom', customPrompt);
                                    setCustomPrompt('');
                                }
                            }}
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Filmstrip (Bottom) */}
            <div className="h-32 border-t bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50">
                <div className="h-full flex items-center gap-4 px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    {/* Section: Product Images */}
                    {productImages.map((img, i) => (
                        <div
                            key={`prod-${i}`}
                            onClick={() => onActiveImageChange(img)}
                            className={cn(
                                "relative h-24 aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 group",
                                activeImage === img ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent opacity-80 hover:opacity-100"
                            )}
                        >
                            <Image src={img} alt="Product" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            {/* Product Badge */}
                            <div className="absolute bottom-1 right-1 bg-black/50 rounded-full p-0.5">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    ))}

                    {/* Separator */}
                    {generations.length > 0 && <div className="w-px h-16 bg-border mx-2 flex-shrink-0" />}

                    {/* Section: Generations */}
                    {generations.map((gen) => (
                        <div
                            key={gen.id}
                            onClick={() => onActiveImageChange(gen.url)}
                            className={cn(
                                "relative h-24 aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 group",
                                activeImage === gen.url ? "border-purple-500 ring-2 ring-purple-500/20 scale-105" : "border-transparent opacity-80 hover:opacity-100"
                            )}
                        >
                            <Image src={gen.url} alt="Generation" fill className="object-cover" />
                            <div className="absolute top-0 right-0 p-1">
                                <span className="flex h-2 w-2 rounded-full bg-purple-500" />
                            </div>
                        </div>
                    ))}

                    {/* Empty State for Gens */}
                    {generations.length === 0 && (
                        <div className="text-xs text-muted-foreground whitespace-nowrap px-4 italic">
                            Generated images will appear here
                        </div>
                    )}
                </div>
            </div>

            <SelectTemplatesDialog
                open={isTemplatePickerOpen}
                onOpenChange={setIsTemplatePickerOpen}
                templates={templates}
                selectedIds={selectedTemplateIds}
                onToggle={(id) => setSelectedTemplateIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                onSelectAll={() => { }}
                onEdit={() => { }}
                onDelete={() => { }}
                mode={'template'}
                onModeChange={() => { }}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
            />
        </div>
    );
}
