'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Edit2, Share2, Copy, Check, Trash2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SocialPostCardProps {
    id: string;
    imageUrl: string;
    caption: string;
    platform: 'instagram' | 'pinterest' | 'etsy';
    onEdit: () => void;
    onUse: () => void;
    onDiscard: () => void;
    isRecommended?: boolean;
}

export function SocialPostCard({ id, imageUrl, caption, platform, onEdit, onUse, onDiscard, isRecommended }: SocialPostCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyCaption = () => {
        navigator.clipboard.writeText(caption);
        setCopied(true);
        toast.success("Caption copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className={cn(
            "overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 flex flex-col h-full",
            isRecommended ? "border-primary shadow-md ring-1 ring-primary/20" : "border-transparent hover:border-border"
        )}>
            {/* Image Preview */}
            <div className="relative aspect-square bg-muted">
                <Image src={imageUrl} alt="Social Post" fill className="object-cover" />

                {/* Platform Badge & Recommended */}
                <div className="absolute top-2 right-2 flex gap-1 flex-col items-end">
                    {isRecommended && (
                        <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Recommended
                        </div>
                    )}
                    <div className="bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide w-fit">
                        {platform}
                    </div>
                </div>
            </div>

            {/* Content Preview */}
            <div className="p-4 bg-background space-y-4 flex-1 flex flex-col">
                <div className="relative flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-normal">
                        {caption}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-0 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={handleCopyCaption}
                    >
                        {copied ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied ? "Copied" : "Copy Caption"}
                    </Button>
                </div>

                {/* V1 Actions Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button onClick={onUse} size="sm" className="w-full col-span-2 shadow-sm font-semibold">
                        Use This
                    </Button>
                    <Button onClick={onEdit} size="sm" variant="secondary" className="w-full text-xs">
                        <Edit2 className="w-3 h-3 mr-1.5" /> Fine Tune
                    </Button>
                    <Button onClick={onDiscard} size="sm" variant="ghost" className="w-full text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="w-3 h-3 mr-1.5" /> Discard
                    </Button>
                </div>
            </div>
        </Card>
    );
}
