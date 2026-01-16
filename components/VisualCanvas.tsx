'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Check, Loader2, Wand2, Image as ImageIcon, Stars, ChevronDown, Palette } from 'lucide-react';
import { SelectTemplatesDialog } from './SelectTemplatesDialog';
import { Template } from '@prisma/client';
import { enhancePrompt } from '@/app/actions/enhance';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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

    // Prompt Bar State
    const [isPromptOpen, setIsPromptOpen] = useState(false);

    // Check if current active image is already in product images
    const isSaved = productImages.includes(activeImage);

    // Auto-open prompt if templates are selected
    useEffect(() => {
        if (selectedTemplateIds.length > 0 && !isPromptOpen) {
            setIsPromptOpen(true);
        }
    }, [selectedTemplateIds]);

    const handleEnhance = async () => {
        if (!customPrompt.trim()) return;
        setIsEnhancing(true);
        const loadingId = toast.loading("Enhancing...");
        try {
            const result = await enhancePrompt(customPrompt);
            if (result.enhancedPrompt) {
                setCustomPrompt(result.enhancedPrompt);
                toast.success("Prompt enhanced!", { id: loadingId });
            } else {
                toast.error(result.error || "Failed", { id: loadingId });
            }
        } catch (e) {
            toast.error("Failed to enhance", { id: loadingId });
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerateClick = () => {
        if (selectedTemplateIds.length > 0) {
            onGenerate('template', selectedTemplateIds);
        } else {
            onGenerate('custom', customPrompt);
        }
        setIsPromptOpen(false); // Collapse on generate
    };

    return (
        <div className="relative h-full w-full bg-zinc-950 flex flex-col overflow-hidden text-white">

            {/* 1. Hero Canvas - Full Bleed */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
                {/* Background pattern or subtle texture could go here */}
                <div className="relative w-full h-full flex items-center justify-center pb-20 p-4">
                    {activeImage ? (
                        <Image
                            src={activeImage}
                            alt="Hero"
                            fill
                            className="object-contain" // Contain ensures entire image is visible.
                            priority
                        />
                    ) : (
                        <div className="text-zinc-500">No image selected</div>
                    )}

                    {/* Add to Listing Action (Floating Overlay) */}
                    {!isSaved && activeImage && (
                        <div className="absolute top-6 right-6 z-10">
                            <Button
                                onClick={() => onAddToProduct(activeImage)}
                                className="bg-black/80 hover:bg-black text-white shadow-lg backdrop-blur-md rounded-full px-4 border border-white/10"
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add to Listing
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Drawer (Kept separate for now, triggered via Prompt Bar or maybe a separate button?) 
                Let's add a separate floating button for Gallery at Top Left or similar.
            */}
            <div className="absolute top-6 left-6 z-10">
                <Drawer open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                    <DrawerTrigger asChild>
                        <Button
                            variant="outline"
                            className="bg-black/50 border-white/10 text-white hover:bg-black/80 backdrop-blur-md rounded-full"
                        >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Gallery
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent className="bg-zinc-900 border-zinc-800 text-white">
                        <div className="mx-auto w-full max-w-sm">
                            <DrawerHeader>
                                <DrawerTitle>Gallery</DrawerTitle>
                                <DrawerDescription className="text-zinc-400">All product images and generations.</DrawerDescription>
                            </DrawerHeader>
                            <div className="p-4 flex flex-wrap gap-2 justify-center max-h-[60vh] overflow-y-auto">
                                {/* Unified Gallery Grid */}
                                {productImages.map((img, i) => (
                                    <div key={`p-${i}`} onClick={() => { onActiveImageChange(img); setIsGalleryOpen(false); }} className={cn("relative w-24 h-32 rounded-lg overflow-hidden border-2 cursor-pointer transition-all", activeImage === img ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-transparent opacity-70 hover:opacity-100")}>
                                        <Image src={img} alt="Product" fill className="object-cover" />
                                        <div className="absolute top-1 left-1 p-0.5 bg-black/50 rounded-full"><Check className="w-3 h-3 text-white" /></div>
                                    </div>
                                ))}
                                {generations.map((gen) => (
                                    <div key={gen.id} onClick={() => { onActiveImageChange(gen.url); setIsGalleryOpen(false); }} className={cn("relative w-24 h-32 rounded-lg overflow-hidden border-2 cursor-pointer transition-all", activeImage === gen.url ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-transparent opacity-70 hover:opacity-100")}>
                                        <Image src={gen.url} alt="Gen" fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>


            {/* Collapsible Prompt Bar */}
            <AnimatePresence>
                {!isPromptOpen ? (
                    /* Closed State: Floating Action Bubble */
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute bottom-6 right-6 z-[100] md:right-10"
                    >
                        <Button
                            size="icon"
                            className={cn(
                                "h-14 w-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] bg-white text-black hover:scale-110 transition-transform duration-200 hover:bg-zinc-100",
                                isGenerating && "animate-pulse ring-4 ring-indigo-500/20"
                            )}
                            onClick={() => {
                                setIsPromptOpen(true);
                            }}
                        >
                            {isGenerating ? (
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                            ) : (
                                <Sparkles className="w-6 h-6 fill-black" />
                            )}
                        </Button>
                    </motion.div>
                ) : (
                    /* Open State: Fixed Bottom Sheet (Absolute within container) */
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-white/10 z-[100] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                    >
                        <div className="max-w-3xl mx-auto w-full p-4 pb-4 flex flex-col gap-3 relative">

                            {/* Close Handler */}
                            <div className="absolute top-2 right-4 z-10">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-zinc-500 hover:text-white hover:bg-white/10"
                                    onClick={() => setIsPromptOpen(false)}
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Input Area */}
                            <div className="w-full relative mt-2">
                                <textarea
                                    className="w-full bg-transparent border-none outline-none text-[18px] text-zinc-100 placeholder:text-zinc-500 resize-none py-2 px-1 leading-relaxed font-normal min-h-[80px]"
                                    placeholder={selectedTemplateIds.length > 0 ? "Add context..." : "What do you want to change?"}
                                    rows={selectedTemplateIds.length > 0 || customPrompt.length > 0 ? 3 : 2}
                                    value={customPrompt}
                                    autoFocus
                                    onChange={(e) => {
                                        setCustomPrompt(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerateClick();
                                        }
                                    }}
                                />
                            </div>

                            {/* Actions Row */}
                            <div className="flex items-center justify-end gap-3 pr-1">

                                {/* Enhance Button */}
                                {customPrompt.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all animate-in fade-in zoom-in duration-200"
                                        onClick={handleEnhance}
                                        disabled={isEnhancing}
                                        title="Enhance"
                                    >
                                        {isEnhancing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                                    </Button>
                                )}

                                {/* Template Palette Icon */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsTemplatePickerOpen(true)}
                                    className={cn(
                                        "h-10 w-10 rounded-full hover:bg-zinc-800 transition-all",
                                        selectedTemplateIds.length > 0 ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-400 hover:text-white"
                                    )}
                                    title="Select Templates"
                                >
                                    <Palette className="w-5 h-5" />
                                    {selectedTemplateIds.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">
                                            {selectedTemplateIds.length}
                                        </span>
                                    )}
                                </Button>

                                {/* Generate Button */}
                                <Button
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 rounded-full flex-shrink-0 transition-all shadow-sm",
                                        isGenerating
                                            ? "bg-zinc-800 text-zinc-500 animate-pulse"
                                            : "bg-white text-black hover:bg-zinc-200 hover:scale-105 active:scale-95"
                                    )}
                                    onClick={handleGenerateClick}
                                    disabled={isGenerating || (!selectedTemplateIds.length && !customPrompt.trim())}
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-5 h-5 fill-black" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


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
