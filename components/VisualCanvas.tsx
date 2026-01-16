
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Check, Loader2, Wand2, Image as ImageIcon, Stars, ChevronUp } from 'lucide-react';
import { SelectTemplatesDialog } from './SelectTemplatesDialog';
import { Template } from '@prisma/client';
import { enhancePrompt } from '@/app/actions/enhance';
import { toast } from 'sonner';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

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
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

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
        <div className="relative h-full w-full bg-black/5 flex flex-col overflow-hidden">
            {/* 1. Hero Canvas - Full Bleed */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                {/* Background pattern or subtle texture could go here */}
                <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                        src={activeImage}
                        alt="Hero"
                        fill
                        className="object-contain" // Contain ensures entire image is visible.
                        priority
                    />

                    {/* Add to Listing Action (Floating Overlay) */}
                    {!isSaved && (
                        <div className="absolute top-6 right-6 z-10">
                            <Button
                                onClick={() => onAddToProduct(activeImage)}
                                className="bg-black/80 hover:bg-black text-white shadow-lg backdrop-blur-md rounded-full px-4"
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add to Listing
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Floating Prompt Bar (Bottom Center) */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center px-4">
                <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-full p-1.5 flex items-center gap-1.5 transition-all hover:bg-white/90">

                    {/* Gallery Trigger */}
                    <Drawer open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                        <DrawerTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-10 w-10 shrink-0 text-muted-foreground hover:bg-black/5 hover:text-foreground"
                                title="Gallery"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <div className="mx-auto w-full max-w-sm">
                                <DrawerHeader>
                                    <DrawerTitle>Gallery</DrawerTitle>
                                    <DrawerDescription>All product images and generations.</DrawerDescription>
                                </DrawerHeader>
                                <div className="p-4 flex flex-wrap gap-2 justify-center max-h-[60vh] overflow-y-auto">
                                    {/* Unified Gallery Grid */}
                                    {productImages.map((img, i) => (
                                        <div key={`p-${i}`} onClick={() => { onActiveImageChange(img); setIsGalleryOpen(false); }} className={cn("relative w-24 h-32 rounded-lg overflow-hidden border-2 cursor-pointer", activeImage === img ? "border-primary" : "border-transparent")}>
                                            <Image src={img} alt="Product" fill className="object-cover" />
                                            <div className="absolute top-1 left-1 p-0.5 bg-black/50 rounded-full"><Check className="w-3 h-3 text-white" /></div>
                                        </div>
                                    ))}
                                    {generations.map((gen) => (
                                        <div key={gen.id} onClick={() => { onActiveImageChange(gen.url); setIsGalleryOpen(false); }} className={cn("relative w-24 h-32 rounded-lg overflow-hidden border-2 cursor-pointer", activeImage === gen.url ? "border-primary" : "border-transparent")}>
                                            <Image src={gen.url} alt="Gen" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DrawerContent>
                    </Drawer>

                    {/* Template Picker */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-10 w-10 shrink-0 text-muted-foreground hover:bg-black/5 hover:text-foreground"
                        onClick={() => setIsTemplatePickerOpen(true)}
                        title="Templates"
                    >
                        <Sparkles className={cn("w-5 h-5", selectedTemplateIds.length > 0 ? "text-primary fill-primary" : "")} />
                    </Button>

                    {/* Input */}
                    <div className="flex-1 relative">
                        <Input
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Describe a change... ✨"
                            className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-10 px-2 text-base placeholder:text-muted-foreground/60"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && customPrompt) {
                                    onGenerate('custom', customPrompt);
                                }
                            }}
                        />
                        {customPrompt.length > 3 && (
                            <button
                                onClick={handleEnhance}
                                disabled={isEnhancing}
                                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-purple-600 transition-colors disabled:opacity-50"
                            >
                                {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stars className="w-4 h-4" />}
                            </button>
                        )}
                    </div>

                    {/* Generate Button */}
                    <Button
                        size="icon"
                        className={cn(
                            "rounded-full h-10 w-10 shrink-0 shadow-md",
                            isGenerating ? "bg-muted text-muted-foreground" : "bg-black text-white hover:bg-black/90"
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

            <SelectTemplatesDialog
                open={isTemplatePickerOpen}
                onOpenChange={setIsTemplatePickerOpen}
                templates={templates}
                selectedIds={selectedTemplateIds}
                onToggle={(id) => setSelectedTemplateIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                onSelectAll={() => { }}
                onEdit={() => { }}
                onDelete={() => { }}
            />
        </div>
    );
}

