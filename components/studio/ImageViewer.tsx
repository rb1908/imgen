"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Download, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface ImageViewerProps {
    isOpen: boolean;
    onClose: () => void;
    currentImage: string;
    images: string[];
    onNavigate: (url: string) => void;
    onDelete?: (url: string) => Promise<void>;
    onDownload?: (url: string) => void;
    onAddToProduct?: (url: string) => Promise<void>;
    canDelete?: boolean;
    canAddToProduct?: boolean;
    isSaved?: boolean;
}

export function ImageViewer({
    isOpen,
    onClose,
    currentImage,
    images,
    onNavigate,
    onDelete,
    onDownload,
    onAddToProduct,
    canDelete = false,
    canAddToProduct = false,
    isSaved = false
}: ImageViewerProps) {
    if (!isOpen) return null;

    const currentIndex = images.indexOf(currentImage);
    const hasNext = currentIndex < images.length - 1;
    const hasPrev = currentIndex > 0;

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && hasPrev) {
                onNavigate(images[currentIndex - 1]);
            } else if (e.key === 'ArrowRight' && hasNext) {
                onNavigate(images[currentIndex + 1]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images, hasPrev, hasNext, onNavigate, onClose]);

    const handleDownload = async () => {
        if (onDownload) {
            onDownload(currentImage);
            return;
        }
        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            window.open(currentImage, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>

            {/* Desktop Navigation */}
            {hasPrev && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 w-12 h-12 rounded-full hidden md:flex transition-all z-[101]"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(images[currentIndex - 1]);
                    }}
                >
                    <ChevronLeft className="w-8 h-8" />
                </Button>
            )}

            {hasNext && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 w-12 h-12 rounded-full hidden md:flex transition-all z-[101]"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(images[currentIndex + 1]);
                    }}
                >
                    <ChevronRight className="w-8 h-8" />
                </Button>
            )}

            {/* Main Image Container */}
            <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center pointer-events-none" >
                {/* Pointer events auto on container for children, but none for self to allow click-through to close? No, onClick is on parent. */}

                <div className="relative w-full h-[80vh] md:h-[85vh] pointer-events-auto" onClick={e => e.stopPropagation()}>
                    <Image
                        key={currentImage}
                        src={currentImage}
                        alt="View"
                        fill
                        className="object-contain animate-in zoom-in-95 duration-200"
                        priority
                    />
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden items-center gap-8 mt-4 pointer-events-auto" onClick={e => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/70 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasPrev) onNavigate(images[currentIndex - 1]);
                            else if (images.length > 1) onNavigate(images[images.length - 1]); // Loop logic if desired, or duplicate `GenerationGrid` logic
                        }}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <span className="text-white/50 text-sm">
                        {currentIndex + 1} / {images.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/70 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasNext) onNavigate(images[currentIndex + 1]);
                            else if (images.length > 1) onNavigate(images[0]);
                        }}
                    >
                        <ChevronRight className="w-8 h-8" />
                    </Button>
                </div>

                {/* Close Button */}
                <Button
                    className="absolute top-0 right-0 md:top-4 md:right-4 rounded-full bg-black/50 hover:bg-black/70 text-white border-none z-[102] pointer-events-auto"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    <span className="sr-only">Close</span>
                    <X className="w-6 h-6" />
                </Button>

                {/* Toolbar */}
                <div className="absolute bottom-4 right-4 hidden md:flex pointer-events-auto gap-2">
                    {/* Add to Product / Remove from Product logic if passed */}
                    {onAddToProduct && !isSaved && (
                        <Button
                            className="rounded-full bg-white text-black hover:bg-zinc-200 shadow-lg"
                            onClick={() => onAddToProduct(currentImage)}
                        >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Use Image
                        </Button>
                    )}

                    <Button
                        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                        onClick={handleDownload}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>

                    {canDelete && onDelete && (
                        <Button
                            className="rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-lg"
                            onClick={async () => {
                                if (confirm("Are you sure?")) {
                                    await onDelete(currentImage);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
