'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Check, Loader2, Wand2, Image as ImageIcon, Stars, ChevronDown, Palette, Upload, ArrowLeft, Paperclip, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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
import { PromptBar } from './PromptBar';

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
    initialViewMode?: 'gallery' | 'editor';
    onClose?: () => void;
    onRemoveFromProduct?: (url: string) => Promise<void>;
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
    initialStudioOpen = false,
    initialViewMode = 'gallery',
    onClose,
    onRemoveFromProduct
}: VisualCanvasProps) {
    // View State
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

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
                            onClick={() => {
                                if (onClose) onClose();
                                else setIsAIStudioOpen(false);
                            }}
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
                        onAddToProduct={onAddToProduct}
                    />
                </div>

                {/* Collapsible Prompt Bar (Replicated from ProjectWorkspace) */}
                <PromptBar
                    isOpen={isPromptOpen}
                    onOpenChange={setIsPromptOpen}
                    prompt={customPrompt}
                    onPromptChange={setCustomPrompt}
                    onGenerate={handleGenerateClick}
                    isGenerating={isGenerating}
                    selectedTemplateCount={selectedTemplateIds.length}
                    onOpenTemplatePicker={() => setIsTemplatePickerOpen(true)}
                    onClearTemplates={() => setSelectedTemplateIds([])}
                >
                    {/* Reference Image Preview */}
                    {referenceImageUrl && (
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-zinc-200 shadow-sm group">
                            <Image src={referenceImageUrl} alt="Ref" fill className="object-cover" />
                            <button
                                onClick={() => setReferenceImageUrl(null)}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

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
                </PromptBar>

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

                <SelectTemplatesDialog
                    open={isTemplatePickerOpen}
                    onOpenChange={setIsTemplatePickerOpen}
                    templates={templates}
                    selectedIds={selectedTemplateIds}
                    onToggle={(id) => setSelectedTemplateIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    onSelectAll={() => {
                        if (selectedTemplateIds.length === templates.length) {
                            setSelectedTemplateIds([]);
                        } else {
                            setSelectedTemplateIds(templates.map(t => t.id));
                        }
                    }}
                    onEdit={() => { }}
                    onDelete={() => { }}
                    forceDrawer={true}
                />

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

                    {/* Navigation Arrows */}
                    {productImages.length > 1 && isSaved && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = productImages.indexOf(activeImage);
                                    if (currentIndex > 0) onActiveImageChange(productImages[currentIndex - 1]);
                                }}
                                disabled={productImages.indexOf(activeImage) <= 0}
                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/50 hover:bg-white shadow-sm z-10 disabled:opacity-0"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = productImages.indexOf(activeImage);
                                    if (currentIndex < productImages.length - 1) onActiveImageChange(productImages[currentIndex + 1]);
                                }}
                                disabled={productImages.indexOf(activeImage) >= productImages.length - 1}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/50 hover:bg-white shadow-sm z-10 disabled:opacity-0"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </Button>
                        </>
                    )}

                    {/* Floating Actions */}
                    <div className="absolute top-6 right-6 z-10 flex gap-2">
                        {isSaved && onRemoveFromProduct && (
                            <Button
                                onClick={async () => {
                                    if (confirm("Remove this image from listing?")) {
                                        await onRemoveFromProduct(activeImage);
                                        // Auto-navigate after delete if possible
                                        const currentIndex = productImages.indexOf(activeImage);
                                        if (currentIndex > 0) onActiveImageChange(productImages[currentIndex - 1]);
                                        else if (productImages.length > 1) onActiveImageChange(productImages[1]); // Next one becomes 0
                                        else onActiveImageChange(""); // No images left
                                    }
                                }}
                                variant="destructive"
                                size="sm"
                                className="rounded-full shadow-lg px-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            >
                                <Trash2 className="w-4 h-4 mr-1.5" />
                                Remove
                            </Button>
                        )}

                        {!isSaved && activeImage && (
                            <Button
                                onClick={() => onAddToProduct(activeImage)}
                                className="bg-white hover:bg-zinc-50 text-black shadow-lg border border-zinc-200 rounded-full px-4"
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add to Listing
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Collapsible Prompt Bar - Reusing logic or maybe we hide it if we are in AI Studio mode viewing an image? 
               Wait, if we are viewing an image, we might want to edit it further.
               Let's keep the prompt bar. It uses 'activeImage' as implied reference? 
               In previous implementation, Editor Prompt Bar uses activeImage. 
               We should keep that.
            */}

            <PromptBar
                isOpen={isPromptOpen}
                onOpenChange={setIsPromptOpen}
                prompt={customPrompt}
                onPromptChange={setCustomPrompt}
                onGenerate={handleGenerateClick}
                isGenerating={isGenerating}
                selectedTemplateCount={selectedTemplateIds.length}
                onOpenTemplatePicker={() => setIsTemplatePickerOpen(true)}
                onClearTemplates={() => setSelectedTemplateIds([])}
            >
                {/* Reference Image Preview */}
                {referenceImageUrl && (
                    <div className="relative h-10 w-10 rounded-md overflow-hidden border border-zinc-200 group flex-shrink-0">
                        <img
                            src={referenceImageUrl}
                            alt="Reference"
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setReferenceImageUrl(null);
                            }}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3 text-white" />
                        </button>
                    </div>
                )}
            </PromptBar>

            <SelectTemplatesDialog
                open={isTemplatePickerOpen}
                onOpenChange={setIsTemplatePickerOpen}
                templates={templates}
                selectedIds={selectedTemplateIds}
                onToggle={(id) => setSelectedTemplateIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                onSelectAll={() => { }}
                onEdit={() => { }}
                onDelete={() => { }}
                forceDrawer={true}
            />
        </div>
    );
}
