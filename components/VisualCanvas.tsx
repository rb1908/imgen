'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Check, Loader2, Wand2, Image as ImageIcon, Stars } from 'lucide-react';
import { SelectTemplatesDialog } from './SelectTemplatesDialog';
import { Template } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import { enhancePrompt } from '@/app/actions/enhance';
import { toast } from 'sonner';

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
    const [isEnhancing, setIsEnhancing] = useState(false);

    // Check if current active image is already in product images
    const isSaved = productImages.includes(activeImage);

    const handleEnhance = async () => {
        if (!customPrompt.trim()) return;
        setIsEnhancing(true);
        try {
            const result = await enhancePrompt(customPrompt);
            if (result.enhancedPrompt) {
                setCustomPrompt(result.enhancedPrompt);
                toast.success("Prompt enhanced!");
            } else {
                toast.error(result.error);
            }
        } catch (e) {
            toast.error("Failed to enhance");
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <div className="relative h-full flex flex-col bg-muted/30">
            {/* 1. Hero Canvas */}
            <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                <div className="relative w-full h-full max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-xl overflow-hidden border bg-background flex items-center justify-center">
                    <Image
                        src={activeImage}
                        alt="Hero"
                        fill
                        className="object-contain" // Use contain to show full image, cover for full bleed. Contain is safer for product editing.
                    />

                    {/* Add to Listing Action (Overlay on Hero) */}
                    {!isSaved && (
                        <div className="absolute top-4 right-4 z-10 transition-all duration-300">
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
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
                    <div className="bg-background/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full p-2 flex items-center gap-2 transition-all hover:scale-[1.01] hover:shadow-primary/10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full shrink-0 hover:bg-muted/50"
                            onClick={() => setIsTemplatePickerOpen(true)}
                            title="Select Templates"
                        >
                            <Sparkles className={cn("w-5 h-5", selectedTemplateIds.length > 0 ? "text-primary fill-primary" : "text-muted-foreground")} />
                            {selectedTemplateIds.length > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span></span>}
                        </Button>

                        <div className="relative flex-1 group">
                            <Input
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Describe a change or choose a look..."
                                className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-10 px-2 pr-8 text-base placeholder:text-muted-foreground/50 transition-colors"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && customPrompt) {
                                        onGenerate('custom', customPrompt);
                                        // Optional: clear prompt after generate? User might want to tweak it.
                                    }
                                }}
                            />
                            {customPrompt.length > 3 && (
                                <button
                                    onClick={handleEnhance}
                                    disabled={isEnhancing}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-purple-500 transition-colors disabled:opacity-50"
                                    title="Enhance Prompt with AI"
                                >
                                    {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stars className="w-4 h-4" />}
                                </button>
                            )}
                        </div>

                        <div className="h-6 w-px bg-border/50 mx-1" />

                        <Button
                            size="icon"
                            className={cn(
                                "rounded-full shrink-0 transition-all duration-300",
                                isGenerating ? "bg-muted text-muted-foreground" : "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground hover:opacity-90 shadow-lg"
                            )}
                            disabled={isGenerating || (!customPrompt && selectedTemplateIds.length === 0)}
                            onClick={() => {
                                if (selectedTemplateIds.length > 0) {
                                    onGenerate('template', selectedTemplateIds);
                                } else {
                                    onGenerate('custom', customPrompt);
                                }
                            }}
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Filmstrip (Bottom) */}
            <div className="h-40 border-t bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 flex flex-col py-3 space-y-2">
                <div className="px-6 flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <span>Project Gallery</span>
                    <span className="text-[10px] opacity-50">{productImages.length + generations.length} items</span>
                </div>

                <div className="flex-1 flex items-center gap-3 px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent pb-2">
                    {/* Section: Product Images */}
                    {productImages.map((img, i) => (
                        <div
                            key={`prod-${i}`}
                            onClick={() => onActiveImageChange(img)}
                            className={cn(
                                "relative h-24 aspect-[4/5] rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 group shadow-sm hover:shadow-md",
                                activeImage === img ? "border-primary ring-2 ring-primary/20 scale-105 z-10" : "border-border/50 opacity-80 hover:opacity-100 hover:border-border"
                            )}
                        >
                            <Image src={img} alt="Product" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            {/* Product Badge */}
                            <div className="absolute top-1 left-1 bg-black/40 backdrop-blur rounded-full p-1 border border-white/10">
                                <Check className="w-2 h-2 text-white" />
                            </div>
                        </div>
                    ))}

                    {/* Separator */}
                    {generations.length > 0 && <div className="w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent mx-2 flex-shrink-0" />}

                    {/* Section: Generations */}
                    {generations.map((gen) => (
                        <div
                            key={gen.id}
                            onClick={() => onActiveImageChange(gen.url)}
                            className={cn(
                                "relative h-24 aspect-[4/5] rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 group shadow-sm hover:shadow-md",
                                activeImage === gen.url ? "border-purple-500 ring-2 ring-purple-500/20 scale-105 z-10" : "border-border/50 opacity-80 hover:opacity-100 hover:border-border"
                            )}
                        >
                            <Image src={gen.url} alt="Generation" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute top-1 right-1">
                                <span className={cn(
                                    "flex h-2 w-2 rounded-full",
                                    activeImage === gen.url ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "bg-purple-500/50"
                                )} />
                            </div>
                        </div>
                    ))}

                    {/* Empty State for Gens */}
                    {generations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-24 w-32 border-2 border-dashed border-border/50 rounded-lg text-muted-foreground/50 text-xs">
                            <Stars className="w-4 h-4 mb-1" />
                            <span>Create Magic</span>
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
