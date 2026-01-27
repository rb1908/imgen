'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Check, Loader2, Wand2, Image as ImageIcon, Stars, ChevronDown, Palette, Upload, ArrowLeft, Paperclip, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { AIIcon } from '../icons/AIIcon';
import { SelectTemplatesDialog } from './SelectTemplatesDialog';
import { GenerationGrid } from './GenerationGrid';
import { ImageViewer } from './ImageViewer';
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
import { ImageUploader } from '../ImageUploader';
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
    onGenerate: (
        mode: 'template' | 'custom', 
        input: string[] | string, 
        referenceImageUrl?: string,
        options?: { aspectRatio: string, resolution: string }
    ) => Promise<void>;
    onAddToProduct: (url: string) => Promise<void>;
    templates: Template[];
    isGenerating: boolean;
    initialStudioOpen?: boolean;
    initialViewMode?: 'gallery' | 'viewer';
    onClose?: () => void;
    onRemoveFromProduct?: (url: string) => Promise<void>;
}

type ViewMode = 'gallery' | 'viewer';

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

    // Side Panel Params
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [resolution, setResolution] = useState('Standard');
    const [batchSize, setBatchSize] = useState(1);

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
        if (isAIStudioOpen) {
            // ...
        }
        setViewMode('viewer');
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
        const options = { aspectRatio, resolution };

        if (selectedTemplateIds.length > 0) {
            // Templates
            // Typescript might complain if onGenerate doesn't accept options. I need to update interface.
            // Casting or assuming interface update below.
            onGenerate('template', selectedTemplateIds, referenceImageUrl || undefined, options);
        } else {
            // Custom
            // No more param suffix concatenation
            if (batchSize > 1) {
                const prompts = Array(batchSize).fill(customPrompt);
                onGenerate('custom', prompts, referenceImageUrl || undefined, options);
            } else {
                onGenerate('custom', customPrompt, referenceImageUrl || undefined, options);
            }
        }
        // setIsPromptOpen(false); 
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

    // RENDER LOGIC
    // 1. AI Studio (Full Screen override)
    if (isAIStudioOpen) {
        return (
            <div className="relative h-full w-full bg-white flex flex-col pt-6 pb-32 px-6 text-zinc-900 overflow-y-auto">
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
                            createdAt: new Date(),
                            referenceName: 'Studio'
                        }))}
                        isGenerating={isGenerating}
                        referenceImageUrl={referenceImageUrl || undefined}
                        referenceName="Studio Reference"
                        onAddToProduct={onAddToProduct}
                    />
                </div>

                {/* Collapsible Prompt Bar */}
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
                    // New Params
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    amount={batchSize}
                    onAmountChange={setBatchSize}
                >
                    {/* Reference UI */}
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
                            onClick={() => document.getElementById('studio-ref-upload-bar')?.click()}
                            className={cn("h-10 w-10 rounded-full hover:bg-zinc-100 transition-all", referenceImageUrl ? "text-indigo-600 bg-indigo-50" : "text-zinc-400 hover:text-black")}
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
                            <div>
                                <h3 className="text-sm font-medium mb-2">Upload New</h3>
                                <div className="h-32">
                                    <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                                            <p className="text-sm text-zinc-500">Click to upload image</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleUploadReference(e.target.files[0]); }} />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium mb-2">From Listing</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {listingImages.slice(0, 8).map((img, i) => (
                                        <div key={i} className="aspect-square relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-indigo-500" onClick={() => { setReferenceImageUrl(img.url); setIsReferencePickerOpen(false); toast.success("Reference selected"); }}>
                                            <Image src={img.url} alt="Listing" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DrawerFooter>
                            <DrawerClose asChild><Button variant="outline" className="w-full">Cancel</Button></DrawerClose>
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
                        if (selectedTemplateIds.length === templates.length) setSelectedTemplateIds([]);
                        else setSelectedTemplateIds(templates.map(t => t.id));
                    }}
                    onEdit={() => { }}
                    onDelete={() => { }}
                    forceDrawer={true}
                />
            </div>
        );
    }

    // 2. Listing Gallery (Default View) + ImageViewer Overlay
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
                        <AIIcon className="w-5 h-5" />
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

            {/* ImageViewer Overlay for Product Images */}
            <ImageViewer
                isOpen={viewMode === 'viewer'}
                onClose={() => {
                    // If we started in viewer mode, close the whole overlay
                    if (initialViewMode === 'viewer' && onClose) {
                        onClose();
                    } else {
                        setViewMode('gallery');
                    }
                }}
                currentImage={activeImage}
                images={productImages}
                onNavigate={(url) => onActiveImageChange(url)}
                onDelete={onRemoveFromProduct} // Use prop directly
                canDelete={!!onRemoveFromProduct && isSaved}
                isSaved={isSaved}
            />
        </div>
    );
}

// Helper removed, was inline
