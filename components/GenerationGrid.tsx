"use client";

import { useState, useEffect } from 'react';

import { GeneratedImage } from '@/app/types';
import { Loader2, Download, Maximize2, Plus, ChevronLeft, ChevronRight, X, ShoppingBag, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TemplateDialog } from './TemplateDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface GenerationGridProps {
    images: (GeneratedImage & { createdAt?: Date; referenceName?: string })[];
    isGenerating?: boolean; // Deprecated but kept for compatibility if needed, or ignored
    pendingImages?: { id: string; prompt: string }[]; // New prop
    selectionMode?: boolean;
    selectedIds?: string[];
    onToggle?: (id: string) => void;
    referenceName?: string;
    referenceImageUrl?: string;
    defaultProductId?: string | null;
}

// Internal Pending Card Component
function PendingCard({ prompt }: { prompt: string }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate progress to 90%
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                // Random increment
                return prev + Math.random() * 5 + 1;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-dashed border-primary/30 flex flex-col items-center justify-center p-4 gap-3 animate-pulse">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="w-full max-w-[80%] space-y-1">
                <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: progress + '%' }}
                    />
                </div>
                <p className="text-[10px] text-center text-muted-foreground font-mono">
                    {Math.round(progress)}%
                </p>
            </div>
            <p className="text-xs text-center text-muted-foreground truncate w-full px-2 opacity-70">
                {prompt}
            </p>
        </div>
    );
}

export function GenerationGrid({
    images,
    isGenerating,
    pendingImages = [], // Default to empty
    selectionMode = false,
    selectedIds = [],
    onToggle,
    referenceImageUrl,
    referenceName = 'project',
    defaultProductId
}: GenerationGridProps) {
    const [expandedImage, setExpandedImage] = useState<GeneratedImage & { referenceName?: string } | null>(null);
    const [imageToSave, setImageToSave] = useState<GeneratedImage | null>(null);

    const getDownloadFilename = (id: string, prompt?: string, refName?: string) => {
        const cleanRefName = (refName || referenceName).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        const cleanPrompt = (prompt || 'generated').slice(0, 50).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        return cleanRefName + '_' + cleanPrompt + '_' + id.slice(0, 4) + '.png';
    };

    const handleDownload = async (imageUrl: string, id: string, prompt?: string, refName?: string) => {
        const filename = getDownloadFilename(id, prompt, refName);
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = filename;
            link.click();
        }
    };

    // Keyboard Navigation
    useEffect(() => {
        if (!expandedImage) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                const currentIndex = images.findIndex(img => img.id === expandedImage.id);
                const prev = currentIndex > 0 ? images[currentIndex - 1] : images[images.length - 1];
                setExpandedImage({ ...prev, referenceName: prev.referenceName || referenceName });
            } else if (e.key === 'ArrowRight') {
                const currentIndex = images.findIndex(img => img.id === expandedImage.id);
                const next = currentIndex < images.length - 1 ? images[currentIndex + 1] : images[0];
                setExpandedImage({ ...next, referenceName: next.referenceName || referenceName });
            } else if (e.key === 'Escape') {
                setExpandedImage(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [expandedImage, images, referenceName]);

    // Removed the isGenerating blocking return

    if (images.length === 0 && pendingImages.length === 0 && !referenceImageUrl) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-card rounded-xl border border-border text-muted-foreground text-sm">
                No generations yet. Upload an image to start!
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-20 md:pb-0">
                {/* Reference Image Card (Index 0) */}
                {referenceImageUrl && (
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/30 border-2 border-dashed border-primary/20 cursor-default group">
                        <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur text-xs font-semibold px-2 py-1 rounded-md border shadow-sm">
                            REFERENCE
                        </div>
                        <Image
                            src={referenceImageUrl}
                            alt="Reference"
                            fill
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                )}

                {/* Pending Items - Show First or Last? Usually newest first, so first. */}
                {pendingImages.map(pending => (
                    <div key={pending.id} className="flex flex-col gap-1">
                        <PendingCard prompt={pending.prompt} />
                    </div>
                ))}

                {/* Real Images */}
                {images.map((img) => {
                    const isSelected = selectedIds.includes(img.id);
                    const refName = img.referenceName || referenceName;
                    const filenameDisplay = refName + '_' + (img.prompt || 'generated').slice(0, 20) + '...';

                    return (
                        <div key={img.id} className="group flex flex-col gap-1">
                            <div
                                className={`relative aspect-square rounded-xl overflow-hidden bg-secondary cursor-pointer transition-all ${isSelected ? 'ring-4 ring-primary ring-inset' : ''}`}
                                onClick={() => {
                                    if (selectionMode && onToggle) {
                                        onToggle(img.id);
                                    } else {
                                        setExpandedImage({ ...img, referenceName: refName });
                                    }
                                }}
                            >
                                <Image
                                    src={img.url}
                                    alt="Generated"
                                    fill
                                    className={`object-cover transition-transform duration-500 ${!selectionMode && 'group-hover:scale-110'} ${isSelected ? 'scale-95' : ''}`}
                                />

                                {/* Selection Checkbox Overlay */}
                                {selectionMode && (
                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-20 ${isSelected ? 'bg-primary border-primary' : 'bg-black/40 border-white/60'}`}>
                                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                    </div>
                                )}

                                {/* New Badge */}
                                {!selectionMode && img.createdAt && (new Date().getTime() - new Date(img.createdAt).getTime() < 24 * 60 * 60 * 1000) && (
                                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10 animate-pulse">
                                        NEW
                                    </div>
                                )}

                                {/* Standard Hover Actions - Hidden in Selection Mode */}
                                {!selectionMode && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <div className="flex gap-2 justify-end">
                                            {defaultProductId && (
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const { addProductImage } = await import('@/app/actions/product_actions');
                                                        const { toast } = await import('sonner');
                                                        const res = await addProductImage(defaultProductId, img.url);
                                                        if (res.success) {
                                                            toast.success("Added to product listing");
                                                        } else {
                                                            toast.error("Failed to add to listing");
                                                        }
                                                    }}
                                                    title="Add to Default Product"
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImageToSave(img);
                                                }}
                                                title="Save as Template"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedImage({ ...img, referenceName: refName });
                                                }}
                                            >
                                                <Maximize2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(img.url, img.id, img.prompt, refName);
                                                }}
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Mobile Actions Menu (Visible on touch/click) */}
                                {!selectionMode && (
                                    <div className="absolute top-2 right-2 md:hidden">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/40 text-white border-none backdrop-blur-md">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {defaultProductId && (
                                                    <DropdownMenuItem onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const { addProductImage } = await import('@/app/actions/product_actions');
                                                        const { toast } = await import('sonner');
                                                        const res = await addProductImage(defaultProductId, img.url);
                                                        if (res.success) {
                                                            toast.success("Added to product listing");
                                                        } else {
                                                            toast.error("Failed to add to listing");
                                                        }
                                                    }}>
                                                        <ShoppingBag className="mr-2 h-4 w-4" />
                                                        <span>Add to Product</span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImageToSave(img);
                                                }}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    <span>Save as Template</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedImage({ ...img, referenceName: refName });
                                                }}>
                                                    <Maximize2 className="mr-2 h-4 w-4" />
                                                    <span>View</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(img.url, img.id, img.prompt, refName);
                                                }}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    <span>Download</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>

                            {/* Subtle Filename Display */}
                            <div className="px-1">
                                <p className="text-[10px] text-muted-foreground truncate font-mono opacity-70 group-hover:opacity-100 transition-opacity">
                                    {filenameDisplay}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Expand Modal */}
            {expandedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setExpandedImage(null)}>

                    {/* Navigation Buttons - Desktop (Fixed on sides) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="fixed left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 w-12 h-12 rounded-full hidden md:flex transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = images.findIndex(img => img.id === expandedImage.id);
                            if (currentIndex > 0) {
                                const prev = images[currentIndex - 1];
                                setExpandedImage({ ...prev, referenceName: prev.referenceName || referenceName });
                            } else {
                                // Loop to last
                                const last = images[images.length - 1];
                                setExpandedImage({ ...last, referenceName: last.referenceName || referenceName });
                            }
                        }}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="fixed right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 w-12 h-12 rounded-full hidden md:flex transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = images.findIndex(img => img.id === expandedImage.id);
                            if (currentIndex < images.length - 1) {
                                const next = images[currentIndex + 1];
                                setExpandedImage({ ...next, referenceName: next.referenceName || referenceName });
                            } else {
                                // Loop to first
                                const first = images[0];
                                setExpandedImage({ ...first, referenceName: first.referenceName || referenceName });
                            }
                        }}
                    >
                        <ChevronRight className="w-8 h-8" />
                    </Button>

                    <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>

                        <div className="relative w-full h-[80vh] md:h-[85vh]">
                            <Image
                                key={expandedImage.id} // Re-render on change for animation if needed
                                src={expandedImage.url}
                                alt="Expanded"
                                fill
                                className="object-contain animate-in zoom-in-95 duration-200"
                                priority
                            />
                        </div>

                        {/* Mobile Navigation (Bottom Bar style or overlay) */}
                        <div className="flex md:hidden items-center gap-8 mt-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/70 hover:text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = images.findIndex(img => img.id === expandedImage.id);
                                    const prev = currentIndex > 0 ? images[currentIndex - 1] : images[images.length - 1];
                                    setExpandedImage({ ...prev, referenceName: prev.referenceName || referenceName });
                                }}
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </Button>
                            <span className="text-white/50 text-sm">
                                {images.findIndex(img => img.id === expandedImage.id) + 1} / {images.length}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/70 hover:text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = images.findIndex(img => img.id === expandedImage.id);
                                    const next = currentIndex < images.length - 1 ? images[currentIndex + 1] : images[0];
                                    setExpandedImage({ ...next, referenceName: next.referenceName || referenceName });
                                }}
                            >
                                <ChevronRight className="w-8 h-8" />
                            </Button>
                        </div>

                        <Button
                            className="absolute top-0 right-0 md:top-4 md:right-4 rounded-full bg-black/50 hover:bg-black/70 text-white border-none z-50"
                            size="icon"
                            onClick={() => setExpandedImage(null)}
                        >
                            <span className="sr-only">Close</span>
                            <X className="w-6 h-6" />
                        </Button>

                        <div className="absolute bottom-4 right-4 hidden md:flex">
                            <Button
                                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                                onClick={() => handleDownload(expandedImage.url, expandedImage.id, expandedImage.prompt)}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Template Dialog */}
            <TemplateDialog
                open={!!imageToSave}
                onOpenChange={(open) => !open && setImageToSave(null)}
                prompt={imageToSave?.prompt || ''}
                thumbnailUrl={imageToSave?.url}
            />
        </>
    );
}
