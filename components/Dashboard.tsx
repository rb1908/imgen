"use client";

import { useState } from 'react';
import { Template } from '@prisma/client';
import { ImageUploader } from '@/components/ImageUploader';
import { GenerationGrid } from '@/components/GenerationGrid';
import { GeneratedImage } from '@/app/types'; // We might need to map Prisma type to this
import { Button } from '@/components/ui/button';
import { Sparkles, Wand2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateVariations } from '@/app/actions/generate';
import { toast } from 'sonner';

interface DashboardProps {
    templates: Template[];
}

export function Dashboard({ templates }: DashboardProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [lastDescription, setLastDescription] = useState<string | null>(null);

    const toggleTemplate = (id: string) => {
        setSelectedTemplateIds(prev =>
            prev.includes(id)
                ? prev.filter(tid => tid !== id)
                : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (!selectedImage || selectedTemplateIds.length === 0) {
            toast.error("Please select an image and at least one template");
            return;
        }

        setIsGenerating(true);
        const formData = new FormData();
        formData.append('image', selectedImage);
        selectedTemplateIds.forEach(id => formData.append('templateId', id));

        try {
            const results = await generateVariations(formData);

            // Map Prisma result to UI type if needed, or just use raw
            const mappedResults = results.map(r => ({
                id: r.id,
                url: r.imageUrl,
                templateId: r.templateId,
                originalImage: r.originalImage || "Generated Variation"
            }));

            setGeneratedImages(prev => [...mappedResults, ...prev]);

            if (results.length > 0) {
                setLastDescription(`Generated ${results.length} variations across ${selectedTemplateIds.length} templates.`);
                toast.success("Batch generation complete!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate variations");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Create Variations (Gemini Powered)</h1>
                <p className="text-muted-foreground">Upload an image. Select one or more templates. Gemini will generate them all.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                            <h3 className="font-semibold">Upload Reference</h3>
                        </div>
                        <ImageUploader
                            selectedImage={selectedImage}
                            onImageSelect={setSelectedImage}
                            onClear={() => setSelectedImage(null)}
                        />
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                            <h3 className="font-semibold">Select Templates ({selectedTemplateIds.length})</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => toggleTemplate(t.id)}
                                    className={cn(
                                        "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                                        selectedTemplateIds.includes(t.id)
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "border-border hover:bg-accent"
                                    )}
                                >
                                    <span className="font-medium text-sm">{t.name}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">{t.prompt}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <Button
                        size="lg"
                        className="w-full gap-2 text-md shadow-lg shadow-primary/20"
                        disabled={!selectedImage || selectedTemplateIds.length === 0 || isGenerating}
                        onClick={handleGenerate}
                    >
                        {isGenerating ? (
                            <>
                                <Sparkles className="w-5 h-5 animate-spin" />
                                Analyzing & Generating...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                Generate Variations
                            </>
                        )}
                    </Button>

                    {lastDescription && (
                        <div className="bg-muted/50 p-4 rounded-xl text-xs space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Info className="w-3 h-3" />
                                Gemini&apos;s Analysis:
                            </h4>
                            <p className="text-muted-foreground italic">&quot;{lastDescription}&quot;</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Results
                        </h3>
                        {generatedImages.length > 0 && (
                            <span className="text-xs text-muted-foreground">{generatedImages.length} generations</span>
                        )}
                    </div>
                    <GenerationGrid images={generatedImages} isGenerating={isGenerating} />
                </div>
            </div>
        </div>
    );
}
