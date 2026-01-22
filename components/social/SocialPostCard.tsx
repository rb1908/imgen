'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Edit2, Share2, Copy, Check } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

interface SocialPostCardProps {
    id: string;
    imageUrl: string;
    caption: string;
    platform: 'instagram' | 'pinterest' | 'etsy';
    onEdit: () => void;
}

export function SocialPostCard({ id, imageUrl, caption, platform, onEdit }: SocialPostCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyCaption = () => {
        navigator.clipboard.writeText(caption);
        setCopied(true);
        toast.success("Caption copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-transparent hover:border-border">
            {/* Image Preview */}
            <div className="relative aspect-square bg-muted">
                <Image src={imageUrl} alt="Social Post" fill className="object-cover" />

                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={onEdit} className="h-8 shadow-sm">
                        <Edit2 className="w-3 h-3 mr-2" />
                        Fine Tune
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 shadow-sm">
                        <Download className="w-3 h-3" />
                    </Button>
                </div>

                {/* Platform Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide">
                    {platform}
                </div>
            </div>

            {/* Content Preview */}
            <div className="p-3 bg-muted/30 space-y-3">
                <div className="relative">
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {caption}
                    </p>
                    <div className="absolute bottom-0 right-0 bg-gradient-to-l from-muted/30 to-transparent w-8 h-full" />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={handleCopyCaption}
                    >
                        {copied ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied ? "Copied" : "Copy Caption"}
                    </Button>
                    <span className="text-[10px] text-muted-foreground/50">Generated just now</span>
                </div>
            </div>
        </Card>
    );
}
