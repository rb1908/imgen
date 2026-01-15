"use client";

import { useState, useEffect } from 'react';

import { GeneratedImage } from '@/app/types';
import { Loader2, Download, Maximize2, Plus } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TemplateDialog } from './TemplateDialog';

export interface GenerationGridProps {
    images: (GeneratedImage & { createdAt?: Date; referenceName?: string })[];
    isGenerating?: boolean; // Deprecated but kept for compatibility if needed, or ignored
    pendingImages?: { id: string; prompt: string }[]; // New prop
    selectionMode?: boolean;
    selectedIds?: string[];
    onToggle?: (id: string) => void;
    referenceName?: string;
    referenceImageUrl?: string;
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
        }, 300);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-dashed border-primary/30 flex flex-col items-center justify-center p-4 gap-3 animate-pulse">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="w-full max-w-[80%] space-y-1">
                <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
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
    referenceName = 'project'
}: GenerationGridProps) {
    const [expandedImage, setExpandedImage] = useState<GeneratedImage & { referenceName?: string } | null>(null);
    const [imageToSave, setImageToSave] = useState<GeneratedImage | null>(null);

    const getDownloadFilename = (id: string, prompt?: string, refName?: string) => {
        const cleanRefName = (refName || referenceName).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        const cleanPrompt = (prompt || 'generated').slice(0, 50).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        return `${cleanRefName}_${cleanPrompt}_${id.slice(0, 4)}.png`;
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
                    const filenameDisplay = `${refName}_${(img.prompt || 'generated').slice(0, 20)}...`;

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setExpandedImage(null)}>
                    <div className="relative max-w-4xl w-full h-auto max-h-[90vh] aspect-square md:aspect-auto md:h-[80vh] rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <Image
                            src={expandedImage.url}
                            alt="Expanded"
                            fill
                            className="object-contain"
                        />
                        <Button
                            className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
                            size="icon"
                            onClick={() => setExpandedImage(null)}
                        >
                            <span className="sr-only">Close</span>
                            {/* SVG Content */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                        <Button
                            className="absolute bottom-4 right-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                            onClick={() => handleDownload(expandedImage.url, expandedImage.id, expandedImage.prompt)}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
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
