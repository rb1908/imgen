'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, Sparkles, X } from 'lucide-react';
import Image from 'next/image';

const VIBES = [
    { id: 'minimal', label: 'Minimal ✨', prompt: 'minimalist, clean background, high end' },
    { id: 'cozy', label: 'Cozy ☕', prompt: 'warm lighting, cozy atmosphere, lifestyle photography' },
    { id: 'summer', label: 'Summer 🌞', prompt: 'bright sunlight, summer vibes, vibrant colors' },
    { id: 'festive', label: 'Festive 🎉', prompt: 'holiday party, confetti, celebration, energetic' },
    { id: 'genz', label: 'Gen-Z 😎', prompt: 'flash photography, harsh lighting, trendy, bold' },
    { id: 'luxury', label: 'Luxury 💎', prompt: 'dark mood, gold accents, premium product photography' },
];

interface SocialInputSectionProps {
    selectedAsset?: string;
    onSelectAsset: () => void;
    onClearAsset: () => void;
    selectedVibe: string;
    onSelectVibe: (vibeId: string) => void;
    isGenerating: boolean;
}

export function SocialInputSection({
    selectedAsset,
    onSelectAsset,
    onClearAsset,
    selectedVibe,
    onSelectVibe,
    isGenerating
}: SocialInputSectionProps) {
    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Create social posts</h1>
                <p className="text-muted-foreground text-sm">Choose an asset and a vibe. We'll handle the rest.</p>
            </div>

            <Card className="p-4 flex flex-col gap-6 md:flex-row items-start md:items-center justify-between border-dashed border-2 shadow-sm bg-muted/20">
                {/* 1. Asset Input */}
                <div className="flex-1 w-full md:w-auto flex flex-col gap-3">
                    <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">1. Input Asset</Label>

                    {!selectedAsset ? (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={onSelectAsset}
                            className="h-24 w-full md:w-48 border-dashed flex flex-col gap-2 hover:border-primary/50 hover:bg-white transition-all"
                        >
                            <div className="p-2 bg-muted rounded-full">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="text-xs font-medium">Select Product / Image</span>
                        </Button>
                    ) : (
                        <div className="relative group w-24 h-24 rounded-lg overflow-hidden border">
                            <Image src={selectedAsset} alt="Selected" fill className="object-cover" />
                            <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={onClearAsset}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-24 bg-border" />

                {/* 2. Vibe Selector */}
                <div className="flex-[2] w-full md:w-auto flex flex-col gap-3">
                    <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider flex items-center gap-2">
                        2. Choose Vibe
                        {selectedVibe && <span className="text-xs font-normal normal-case text-primary">• {VIBES.find(v => v.id === selectedVibe)?.label}</span>}
                    </Label>

                    <div className="flex flex-wrap gap-2">
                        {VIBES.map(vibe => (
                            <button
                                key={vibe.id}
                                onClick={() => onSelectVibe(vibe.id)}
                                disabled={isGenerating}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                                    selectedVibe === vibe.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                {vibe.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}
