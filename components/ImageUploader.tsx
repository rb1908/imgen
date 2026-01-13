"use client";

import { useState, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    selectedImage: File | null;
    onClear: () => void;
}

export function ImageUploader({ onImageSelect, selectedImage, onClear }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileSelect = (file: File) => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        onImageSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                handleFileSelect(file);
            }
        }
    };

    const clearImage = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        onClear();
    };

    return (
        <div className="w-full">
            {!selectedImage ? (
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-card",
                        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
                    )}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="w-12 h-12 mb-4 rounded-full bg-secondary flex items-center justify-center">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="mb-2 text-sm text-foreground font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 5MB)</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                handleFileSelect(e.target.files[0]);
                            }
                        }}
                    />
                </label>
            ) : (
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-border group bg-black/50">
                    {previewUrl && (
                        <Image
                            src={previewUrl}
                            alt="Selected"
                            fill
                            className="object-contain"
                        />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            onClick={clearImage}
                            className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-transform hover:scale-110"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono backdrop-blur-sm">
                        Reference Image
                    </div>
                </div>
            )}
        </div>
    );
}
