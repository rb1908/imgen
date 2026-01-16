'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Check, Loader2, Wand2, Image as ImageIcon, Stars, ChevronDown, Palette, Upload, ArrowLeft } from 'lucide-react';
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
import { ImageUploader } from './ImageUploader';

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

type ViewMode = 'gallery' | 'editor';

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
    // View State
    const [viewMode, setViewMode] = useState<ViewMode>('gallery');
    const [isSelectingReference, setIsSelectingReference] = useState(false);

    const [customPrompt, setCustomPrompt] = useState('');
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [isEnhancing, setIsEnhancing] = useState(false);

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

    // Handle Image Click in Gallery
    const handleImageClick = (url: string) => {
        onActiveImageChange(url);

        if (isSelectingReference) {
            // User selected the reference for AI generation
            setIsSelectingReference(false);
            setViewMode('editor');
            setIsPromptOpen(true); // Open prompt immediately
            toast.success("Reference selected! Describe your changes.");
        } else {
            // Normal view
            setViewMode('editor');
        }
    };

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

    // Split images for display
    // 1. Listing Images (Product Images)
    const listingImages = productImages.map(url => ({ url, type: 'product' as const }));

    // 2. AI Generations (Exclude images that are effectively already in the listing to avoid dupes, if strict 'not part of listing' is desired. 
    // However, usually users want to see all generations. But the user explicitly said "images that are not part of the listing".
    // We'll trust that request.)
    const unseenGenerations = generations
        .filter(g => !productImages.includes(g.url))
        .map(g => ({ url: g.url, type: 'generation' as const, id: g.id }));

    if (viewMode === 'gallery') {
        return (
            <div className="relative h-full w-full bg-zinc-950 flex flex-col p-6 text-white overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full space-y-12">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 min-h-[40px]">
                        {/* Title removed as per request */}
                        <div />

                        {isSelectingReference && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full animate-pulse font-medium text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Select a reference image
                            </div>
                        )}
                    </div>

                    {/* Section 1: Listing Images */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-zinc-400" />
                                Listing Images
                                <span className="text-xs font-normal text-zinc-500 ml-2">{listingImages.length} items</span>
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {/* "Add New" Action Card */}
                            <div className="aspect-[3/4] rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors flex flex-col items-center justify-center p-4 gap-4 group relative overflow-hidden">
                                <div className="text-center space-y-1 z-10">
                                    <span className="font-medium text-zinc-200">Add New</span>
                                    <p className="text-xs text-zinc-500">Upload or Generate</p>
                                </div>

                                <div className="flex items-center gap-3 z-10">
                                    {/* Upload Action */}
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all"
                                            onClick={() => {
                                                toast.info("Upload feature coming soon");
                                            }}
                                            title="Upload Image"
                                        >
                                            <Upload className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    {/* AI Generate Action */}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className={cn(
                                            "h-10 w-10 rounded-full border-zinc-700 hover:text-white transition-all",
                                            isSelectingReference
                                                ? "bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600"
                                                : "bg-zinc-800 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-400"
                                        )}
                                        onClick={() => {
                                            setIsSelectingReference(!isSelectingReference);
                                            if (!isSelectingReference) {
                                                toast.info("Select an image to use as reference");
                                            } else {
                                                toast.dismiss();
                                            }
                                        }}
                                        title="Generate with AI"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Listing Images Grid */}
                            {listingImages.map((img, idx) => (
                                <div
                                    key={`prod-${idx}`}
                                    onClick={() => handleImageClick(img.url)}
                                    className={cn(
                                        "aspect-[3/4] rounded-xl relative overflow-hidden cursor-pointer group bg-zinc-900 border transition-all duration-200",
                                        isSelectingReference
                                            ? "hover:ring-4 ring-indigo-500/40 border-indigo-500/50 hover:scale-[1.02]"
                                            : "border-transparent hover:border-zinc-700 hover:shadow-xl"
                                    )}
                                >
                                    <Image
                                        src={img.url}
                                        alt="Product Image"
                                        fill
                                        className={cn(
                                            "object-cover transition-transform duration-500",
                                            !isSelectingReference && "group-hover:scale-105"
                                        )}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 2: AI Generations */}
                    {unseenGenerations.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
                                    <Sparkles className="w-4 h-4" />
                                    AI Creations
                                    <span className="text-xs font-normal text-zinc-500 ml-2">{unseenGenerations.length} items</span>
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {unseenGenerations.map((gen, idx) => (
                                    <div
                                        key={`gen-${gen.id}`}
                                        onClick={() => handleImageClick(gen.url)}
                                        className={cn(
                                            "aspect-[3/4] rounded-xl relative overflow-hidden cursor-pointer group bg-zinc-900 border transition-all duration-200",
                                            isSelectingReference
                                                ? "hover:ring-4 ring-indigo-500/40 border-indigo-500/50 hover:scale-[1.02]"
                                                : "border-transparent hover:border-zinc-700 hover:shadow-xl"
                                        )}
                                    >
                                        <Image
                                            src={gen.url}
                                            alt="AI Generation"
                                            fill
                                            className={cn(
                                                "object-cover transition-transform duration-500",
                                                !isSelectingReference && "group-hover:scale-105"
                                            )}
                                        />
                                        <div className="absolute top-2 left-2 bg-indigo-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-white shadow-sm">
                                            AI Generated
                                        </div>

                                        {/* Quick Action: Add to Listing */}
                                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white text-black hover:bg-zinc-200"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddToProduct(gen.url);
                                                }}
                                                title="Add to Listing"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        );
    }

    // EDITOR VIEWER (The "Hero" View)
    return (
        <div className="relative h-full w-full bg-zinc-950 flex flex-col overflow-hidden text-white">

            {/* Back to Gallery */}
            <div className="absolute top-6 left-6 z-20">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('gallery')}
                    className="text-white/70 hover:text-white hover:bg-white/10 gap-2 pl-2 rounded-full"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Gallery
                </Button>
            </div>

            {/* 1. Hero Canvas - Full Bleed */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
                <div className="relative w-full h-full flex items-center justify-center pb-20 p-4">
                    {activeImage ? (
                        <Image
                            src={activeImage}
                            alt="Hero"
                            fill
                            className="object-contain"
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
