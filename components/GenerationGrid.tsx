"use client";

import { useState } from 'react';

import { GeneratedImage } from '@/app/types';
import { Loader2, Download, Maximize2, Plus } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TemplateDialog } from './TemplateDialog';

// Removed corrupted lines

export interface GenerationGridProps {
    images: (GeneratedImage & { createdAt?: Date })[];
    isGenerating: boolean;
    selectionMode?: boolean;
    selectedIds?: string[];
    referenceImageUrl?: string;
}

export function GenerationGrid({
    images,
    isGenerating,
    selectionMode = false,
    selectedIds = [],
    onToggle,
    referenceImageUrl
}: GenerationGridProps) {
    const [expandedImage, setExpandedImage] = useState<GeneratedImage | null>(null);
    const [imageToSave, setImageToSave] = useState<GeneratedImage | null>(null);

    // ... download handler ...

    if (isGenerating) {
        // ... loading state ...
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-accent/20 rounded-xl border border-dashed border-primary/20 animate-pulse">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground animate-bounce">Dreaming up variations...</p>
            </div>
        );
    }

    if (images.length === 0 && !referenceImageUrl) {
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

                {images.map((img) => {
                    const isSelected = selectedIds.includes(img.id);
                    // ... rest of item render ...
                    return (
                        <div
                            key={img.id}
                            className={`group relative aspect-square rounded-xl overflow-hidden bg-secondary cursor-pointer transition-all ${isSelected ? 'ring-4 ring-primary ring-inset' : ''}`}
                            onClick={() => {
                                if (selectionMode && onToggle) {
                                    onToggle(img.id);
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
                                                setExpandedImage(img);
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
                                                handleDownload(img.url, img.id);
                                            }}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                        <Button
                            className="absolute bottom-4 right-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                            onClick={() => handleDownload(expandedImage.url, expandedImage.id)}
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
