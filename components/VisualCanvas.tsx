'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Check, Loader2, Wand2, Image as ImageIcon, Stars, ChevronDown, Palette, Upload, ArrowLeft, Paperclip, X } from 'lucide-react';
import { SelectTemplatesDialog } from './SelectTemplatesDialog';
import { GenerationGrid } from './GenerationGrid';
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
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for client-side uploads if needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface VisualCanvasProps {
    activeImage: string;
    onActiveImageChange: (url: string) => void;
    productImages: string[];
    generations: { id: string; url: string; prompt?: string }[];
    onGenerate: (mode: 'template' | 'custom', input: string[] | string, referenceImageUrl?: string) => Promise<void>;
    onAddToProduct: (url: string) => Promise<void>;
    templates: Template[];
    isGenerating: boolean;
    initialStudioOpen?: boolean;
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
    isGenerating,
    initialStudioOpen = false
}: VisualCanvasProps) {
    // View State
    const [viewMode, setViewMode] = useState<ViewMode>('gallery');

    // AI Studio State
    // AI Studio State
    // AI Studio State
    const [isAIStudioOpen, setIsAIStudioOpen] = useState(initialStudioOpen); // Controls the AI Studio View

    const [customPrompt, setCustomPrompt] = useState('');
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [isEnhancing, setIsEnhancing] = useState(false);

    // Reference Image State
    const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
    const [isReferencePickerOpen, setIsReferencePickerOpen] = useState(false);

    // Prompt Bar State (For AI Studio)
    const [isPromptOpen, setIsPromptOpen] = useState(false);

    // Listing Images (Product Images)
    const listingImages = productImages.map(url => ({ url, type: 'product' as const }));

    // AI Generations (for AI Studio Grid) - Shows ALL generations
    const allGenerations = generations.map(g => ({ url: g.url, type: 'generation' as const, id: g.id }));

    // Check if current active image is already in product images
    const isSaved = productImages.includes(activeImage);

    // Auto-open prompt if templates are selected
    useEffect(() => {
        if (selectedTemplateIds.length > 0 && !isPromptOpen) {
            setIsPromptOpen(true);
        }
    }, [selectedTemplateIds]);

    const handleImageClick = (url: string) => {
        onActiveImageChange(url);
        // If in AI Studio, maybe selecting an image enters "Editor" mode for that image? 
        // Or AI Studio is just a feed and clicking opens a detailed view?
        // User said: "AI Studio where all past ai generated images are shown. even any image generated... show generation bubble as well."
        // Let's assume clicking an image in AI Studio just previews it or sets it as reference?
        // Default behavior: Switch to Editor View (same as Gallery)
        // If we are in AI Studio, and click an image, maybe we just view it?
        // For simplicity, let's allow "viewing" via the standard Editor Mode, but we need a way to go BACK to AI Studio.

        if (isAIStudioOpen) {
            // Maybe we stay in AI Studio but have a lightbox? 
            // Or reuse Editor. Let's reuse Editor but with a "Back to AI Studio" button.
            // Currently Editor has "Back to Gallery".
        }
        setViewMode('editor');
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
            // Templates usually don't need a reference unless specified, but for now we only support reference in Custom mode ideally
            // or pass it along? The action supports it.
            onGenerate('template', selectedTemplateIds, referenceImageUrl || undefined);
        } else {
            onGenerate('custom', customPrompt, referenceImageUrl || undefined);
        }
        // setIsPromptOpen(false); // Can collapse or stay open
    };

    const handleUploadReference = async (file: File) => {
        const loadingId = toast.loading("Uploading reference...");
        try {
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('images').upload(fileName, file);
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
            setReferenceImageUrl(publicUrl);
            setIsReferencePickerOpen(false);
            toast.success("Reference attached", { id: loadingId });
        } catch (e) {
            console.error(e);
            toast.error("Failed to upload reference", { id: loadingId });
        }
    };

    // AI STUDIO VIEW
    if (isAIStudioOpen && viewMode === 'gallery') {
        return (
            <div className="relative h-full w-full bg-white flex flex-col pt-6 pb-32 px-6 text-zinc-900 overflow-y-auto"> {/* pb-32 for prompt bar */}
                <div className="max-w-7xl mx-auto w-full space-y-8">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsAIStudioOpen(false)}
                            className="rounded-full -ml-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 flex items-center justify-between">
                            <h2 className="text-xl font-bold tracking-tight">Results</h2>
                            <span className="text-zinc-500 text-sm">{allGenerations.length} images</span>
                        </div>
                    </div>

                    {/* Generation Grid */}
                    <GenerationGrid
                        images={allGenerations.map(g => ({
                            id: g.id,
                            url: g.url,
                            templateId: 'custom',
                            originalImage: 'Generated Image',
                            prompt: 'Generated Image',
                            createdAt: new Date(), // We might not have date here, defaulting
                            referenceName: 'Studio'
                        }))}
                        isGenerating={isGenerating}
                        referenceImageUrl={referenceImageUrl || undefined}
                        referenceName="Studio Reference"
                    />
                </div>

                {/* Collapsible Prompt Bar (Replicated from ProjectWorkspace) */}
                <AnimatePresence>
                    {!isPromptOpen ? (
                        /* Closed State: Floating Action Bubble */
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="fixed bottom-6 right-6 z-[100] md:right-10"
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
                        /* Open State: Fixed Bottom Sheet */
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-[100] md:pl-72 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                        >
                            <div className="max-w-3xl mx-auto w-full p-4 pb-4 flex flex-col gap-3 relative">

                                {/* Close Handler (Hit Area & Icon) */}
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

                                <div className="w-full relative mt-2">
                                    <textarea
                                        className="w-full bg-transparent border-none outline-none text-[18px] text-zinc-900 placeholder:text-zinc-400 resize-none py-2 px-1 leading-relaxed font-normal min-h-[80px]"
                                        placeholder="What do you want to create?"
                                        rows={3}
                                        value={customPrompt}
                                        autoFocus
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleGenerateClick();
                                            }
                                        }}
                                    />
                                </div>

                                {/* Reference Image Preview in Bar */}
                                {referenceImageUrl && (
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-zinc-200">
                                            <Image src={referenceImageUrl} alt="Ref" fill className="object-cover" />
                                            <button
                                                onClick={() => setReferenceImageUrl(null)}
                                                className="absolute top-0 right-0 bg-black/50 hover:bg-red-500 text-white p-0.5 rounded-bl"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="text-xs text-zinc-500">Reference Image Selected</span>
                                    </div>
                                )}


                                {/* Actions Row (Bottom Right) */}
                                <div className="flex items-center justify-end gap-3 pr-1">

                                    {/* Upload Reference Button */}
                                    <div className="relative">
                                        <Input
                                            type="file"
                                            id="studio-ref-upload-bar"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleUploadReference(e.target.files[0]);
                                            }}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-10 w-10 rounded-full hover:bg-zinc-100 transition-all",
                                                referenceImageUrl ? "text-indigo-600 bg-indigo-50" : "text-zinc-400 hover:text-black"
                                            )}
                                            onClick={() => document.getElementById('studio-ref-upload-bar')?.click()}
                                            title="Upload Reference"
                                        >
                                            <Upload className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    {/* Template Palette Icon */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsTemplatePickerOpen(true)}
                                        className={cn(
                                            "h-10 w-10 rounded-full hover:bg-zinc-100 transition-all",
                                            selectedTemplateIds.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-zinc-400 hover:text-black" // Simplify template selection vis
                                        )}
                                        title="Select Templates"
                                    >
                                        <Palette className="w-5 h-5" />
                                    </Button>

                                    {/* Generate Button (Run) */}
                                    <Button
                                        size="icon"
                                        className={cn(
                                            "h-10 w-10 rounded-full flex-shrink-0 transition-all shadow-sm",
                                            isGenerating
                                                ? "bg-zinc-100 text-zinc-400 animate-pulse"
                                                : "bg-black text-white hover:bg-zinc-800 hover:scale-105 active:scale-95"
                                        )}
                                        onClick={handleGenerateClick}
                                        disabled={isGenerating || (!customPrompt.trim() && !referenceImageUrl)}
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-5 h-5 fill-white" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Reference Picker Drawer/Dialog */}
                <Drawer open={isReferencePickerOpen} onOpenChange={setIsReferencePickerOpen}>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>Select Reference Image</DrawerTitle>
                            <DrawerDescription>Upload a photo or choose from your listing.</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 space-y-6">
                            {/* Upload Area */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Upload New</h3>
                                <div className="h-32">
                                    <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                                            <p className="text-sm text-zinc-500">Click to upload image</p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleUploadReference(e.target.files[0]);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Listing Images */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">From Listing</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {listingImages.slice(0, 8).map((img, i) => (
                                        <div
                                            key={i}
                                            className="aspect-square relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-indigo-500"
                                            onClick={() => {
                                                setReferenceImageUrl(img.url);
                                                setIsReferencePickerOpen(false);
                                                toast.success("Reference selected");
                                            }}
                                        >
                                            <Image src={img.url} alt="Listing" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DrawerFooter>
                            <DrawerClose asChild>
                                <Button variant="outline" className="w-full">Cancel</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>

            </div>
        );
    }

    // LISTING GALLERY VIEW (Default)
    if (viewMode === 'gallery') {
        return (
            <div className="relative h-full w-full bg-white flex flex-col p-6 text-zinc-900 overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Listing Images</h2>
                            <p className="text-zinc-500">Manage your product photos.</p>
                        </div>
                        <Button
                            onClick={() => setIsAIStudioOpen(true)}
                            className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 pl-4 pr-5 py-6 gap-2"
                        >
                            <Sparkles className="w-5 h-5 fill-white/20" />
                            <span className="font-medium text-base">AI Studio</span>
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {/* Listing Images Grid */}
                        {listingImages.map((img, idx) => (
                            <div
                                key={`prod-${idx}`}
                                onClick={() => handleImageClick(img.url)}
                                className="aspect-[3/4] rounded-xl relative overflow-hidden cursor-pointer group bg-zinc-100 border border-zinc-200 transition-all duration-200 shadow-sm hover:shadow-md hover:border-zinc-300"
                            >
                                <Image
                                    src={img.url}
                                    alt="Product Image"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                        ))}
                        {/* Empty State */}
                        {listingImages.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                                <p className="text-zinc-500">No listing images yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // EDITOR VIEW (When an image is selected)
    // Needs slight adjustment to handle "Back" logic:
    // If we came from AI Studio -> Back should probably go to AI Studio? or just Close Editor?
    // Let's stick to "Back to Gallery" for now, or intelligent back.
    const handleBack = () => {
        // If we opened this from AI Studio (isAIStudioOpen is true), we probably want to go back there?
        // But the current logic clears only viewMode.
        // If we want to support 'Back to Studio', we need to check isAIStudioOpen
        if (isAIStudioOpen) {
            setViewMode('gallery'); // Back to "AI Studio Gallery"
        } else {
            setViewMode('gallery'); // Back to "Listing Gallery"
        }
    };

    return (
        <div className="relative h-full w-full bg-white flex flex-col overflow-hidden text-zinc-900">

            {/* Back Button */}
            <div className="absolute top-6 left-6 z-20">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="text-zinc-500 hover:text-black hover:bg-black/5 gap-2 pl-2 rounded-full"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {isAIStudioOpen ? "Studio" : "Gallery"}
                </Button>
            </div>

            {/* 1. Hero Canvas */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
                <div className="relative w-full h-full flex items-center justify-center pb-20 p-4">
                    {activeImage ? (
                        <Image
                            src={activeImage}
                            alt="Hero"
                            fill
                            className="object-contain" // removed mix-blend
                            priority
                        />
                    ) : (
                        <div className="text-zinc-400">No image selected</div>
                    )}

                    {/* Floating Add to Listing */}
                    {!isSaved && activeImage && (
                        <div className="absolute top-6 right-6 z-10">
                            <Button
                                onClick={() => onAddToProduct(activeImage)}
                                className="bg-white hover:bg-zinc-50 text-black shadow-lg border border-zinc-200 rounded-full px-4"
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add to Listing
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Collapsible Prompt Bar - Reusing logic or maybe we hide it if we are in AI Studio mode viewing an image? 
               Wait, if we are viewing an image, we might want to edit it further.
               Let's keep the prompt bar. It uses 'activeImage' as implied reference? 
               In previous implementation, Editor Prompt Bar uses activeImage. 
               We should keep that.
            */}

            <AnimatePresence>
                {!isPromptOpen ? (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute bottom-6 right-6 z-[100] md:right-10"
                    >
                        <Button
                            size="icon"
                            className={cn(
                                "h-14 w-14 rounded-full shadow-lg border border-zinc-200 bg-white text-black hover:scale-110",
                                isGenerating && "animate-pulse ring-4 ring-indigo-500/20"
                            )}
                            onClick={() => setIsPromptOpen(true)}
                        >
                            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> : <Sparkles className="w-6 h-6 fill-black" />}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-[100] rounded-t-[2.5rem] shadow-2xl"
                    >
                        <div className="max-w-3xl mx-auto w-full p-4 pb-4 flex flex-col gap-3 relative">
                            <div className="absolute top-2 right-4 z-10">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-zinc-400 hover:text-black"
                                    onClick={() => setIsPromptOpen(false)}
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="w-full relative mt-2">
                                <textarea
                                    className="w-full bg-transparent border-none outline-none text-[18px] text-zinc-900 placeholder:text-zinc-400 resize-none py-2 px-1 leading-relaxed font-normal min-h-[80px]"
                                    placeholder={selectedTemplateIds.length > 0 ? "Add context..." : "What do you want to change?"}
                                    rows={selectedTemplateIds.length > 0 || customPrompt.length > 0 ? 3 : 2}
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerateClick();
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pr-1">
                                {customPrompt.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full text-indigo-600"
                                        onClick={handleEnhance}
                                        disabled={isEnhancing}
                                        title="Enhance"
                                    >
                                        {isEnhancing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsTemplatePickerOpen(true)}
                                    className={cn(
                                        "h-10 w-10 rounded-full",
                                        selectedTemplateIds.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-zinc-400 hover:text-black"
                                    )}
                                >
                                    <Palette className="w-5 h-5" />
                                    {selectedTemplateIds.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                            {selectedTemplateIds.length}
                                        </span>
                                    )}
                                </Button>
                                <Button
                                    size="icon"
                                    className="h-10 w-10 rounded-full flex-shrink-0 bg-black text-white hover:bg-zinc-800"
                                    onClick={handleGenerateClick}
                                    disabled={isGenerating || (!selectedTemplateIds.length && !customPrompt.trim())}
                                >
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 fill-white" />}
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
