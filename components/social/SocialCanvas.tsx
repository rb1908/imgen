'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SocialCanvasProps {
    format: 'square' | 'story' | 'og';
    backgroundColor: string;
    backgroundImage?: string;
    overlays: any[]; // To be defined strictly later
    onDrop: (item: any) => void;
}

export function SocialCanvas({ format, backgroundColor, backgroundImage, overlays, onDrop }: SocialCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);

    const aspectRatios = {
        square: 'aspect-square', // 1:1
        story: 'aspect-[9/16]',   // 9:16
        og: 'aspect-[1.91/1]',    // 1.91:1
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-accent/20 p-8 h-full overflow-hidden">
            <motion.div
                layout
                ref={canvasRef}
                className={cn(
                    "relative bg-white shadow-2xl transition-all duration-300 w-full max-w-[500px] mx-auto",
                    aspectRatios[format]
                )}
                style={{ backgroundColor }}
            >
                {/* Background Image */}
                {backgroundImage && (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${backgroundImage})` }}
                    />
                )}

                {/* Overlays Placeholder */}
                {overlays.map((layer, idx) => (
                    <div
                        key={idx}
                        className="absolute bg-white/90 p-2 rounded shadow-sm text-sm font-bold border border-gray-200"
                        style={{ top: '10%', left: '10%' }}
                    >
                        {layer.content || "Overlay"}
                    </div>
                ))}

                {/* Empty State / Drop Zone hint */}
                {!backgroundImage && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-grid-black/[0.05]">
                        <p className="text-sm font-medium">Drop Product Here</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
