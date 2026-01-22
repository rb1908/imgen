'use client';

import { useState } from 'react';
import { PageScaffold } from '@/components/PageScaffold';
import { PageHeader } from '@/components/PageHeader';
import { AssetPickerDialog } from '@/components/social/AssetPickerDialog';
import { SocialInputSection } from '@/components/social/SocialInputSection';
import { SocialPostCard } from '@/components/social/SocialPostCard';
import { ExportDialog } from '@/components/social/ExportDialog';
import { FineTuneCanvas } from '@/components/social/FineTuneCanvas';
import { generatePostVariants, SocialPostVariant } from '@/app/actions/social_generator';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SocialGeneratorPage() {
    // Input State
    const [selectedAsset, setSelectedAsset] = useState<string | undefined>(undefined);
    const [selectedVibe, setSelectedVibe] = useState<string>('');
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [variants, setVariants] = useState<SocialPostVariant[]>([]);

    // Export State
    const [exportPost, setExportPost] = useState<SocialPostVariant | null>(null);

    const handleGenerate = async () => {
        if (!selectedAsset) return toast.error("Please select an asset first");
        if (!selectedVibe) return toast.error("Please select a vibe");

        setIsGenerating(true);
        setVariants([]); // Clear previous results? Or append? Let's clear for now.

        try {
            const res = await generatePostVariants(selectedAsset, selectedVibe);
            if (res.success && res.variants) {
                setVariants(res.variants);
                toast.success("Generated 3 variants!");
            } else {
                toast.error(res.error || "Generation failed");
            }
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDiscard = (id: string) => {
        setVariants(prev => prev.filter(v => v.id !== id));
        toast.info("Option discarded");
    };

    return (
        <PageScaffold>
            <div className="flex flex-col min-h-full bg-background pb-32 relative">
                <PageHeader
                    title="Social Studio"
                    description="Turn your products into social content in seconds."
                />

                <main className="flex-1 container max-w-5xl mx-auto p-6 space-y-12">

                    {/* 1. Input Section */}
                    <SocialInputSection
                        selectedAsset={selectedAsset}
                        onSelectAsset={() => setIsAssetPickerOpen(true)}
                        onClearAsset={() => setSelectedAsset(undefined)}
                        selectedVibe={selectedVibe}
                        onSelectVibe={setSelectedVibe}
                        isGenerating={isGenerating}
                    />

                    {/* 2. Generation Action (Centrally placed if no results, otherwise bottom?) */}
                    {/* Actually, let's put it right below Input for clear flow */}
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            className="rounded-full px-8 h-12 text-base shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-105"
                            onClick={handleGenerate}
                            disabled={isGenerating || !selectedAsset || !selectedVibe}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Creating Magic...
                                </>
                            ) : (
                                <>
                                    Generate Posts <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* 3. Output Grid */}
                    {variants.length > 0 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Generated Options</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {variants.map((variant, index) => (
                                    <SocialPostCard
                                        key={variant.id}
                                        {...variant}
                                        isRecommended={index === 0} // First one is recommended
                                        onUse={() => setExportPost(variant)}
                                        onEdit={() => toast.info("Fine-tuning coming soon!")}
                                        onDiscard={() => handleDiscard(variant.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </main>

                <AssetPickerDialog
                    open={isAssetPickerOpen}
                    onOpenChange={setIsAssetPickerOpen}
                    onSelect={(url) => {
                        setSelectedAsset(url);
                        // Auto-select vibe if not selected?
                    }}
                />

                <ExportDialog
                    open={!!exportPost}
                    onOpenChange={(open) => !open && setExportPost(null)}
                    post={exportPost}
                />
            </div>
        </PageScaffold>
    );
}
