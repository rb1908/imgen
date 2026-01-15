'use client';

import { useState, useMemo } from 'react';
import { Product, Project, Template, Generation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenerationGrid } from '@/components/GenerationGrid';
import { generateVariations } from '@/app/actions/generate';
import { toast } from 'sonner';
import { Sparkles, ArrowLeft, Loader2, Save, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductDetailForm } from './ProductDetailForm'; // Reuse existing logic
import { SelectTemplatesDialog } from './SelectTemplatesDialog';
import { cn } from '@/lib/utils';
import { addProductImages } from '@/app/actions/product_actions'; // Import server action to add gen to product

interface ProductWorkspaceProps {
    product: Product;
    project: Project & { generations: Generation[] };
    templates: Template[];
}

export function ProductWorkspace({ product, project, templates }: ProductWorkspaceProps) {
    const [generations, setGenerations] = useState<Generation[]>(project.generations);

    // Generation State
    const [activeImage, setActiveImage] = useState<string>(product.images[0] || 'https://placehold.co/600x400?text=No+Image');
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');
    const [mode, setMode] = useState<'template' | 'custom'>('template');
    const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating'>('idle');
    const [pendingGenerations, setPendingGenerations] = useState<{ id: string; prompt: string }[]>([]);
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

    // Selection State (for Bulk Actions) - reusing simple selection for "Add to Product"
    const [selectedGenerationIds, setSelectedGenerationIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Handlers
    const toggleGenerationSelection = (id: string) => {
        setSelectedGenerationIds(prev =>
            prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (mode === 'template' && selectedTemplateIds.length === 0) {
            toast.error("Select at least one template");
            return;
        }
        if (mode === 'custom' && !customPrompt.trim()) {
            toast.error("Enter a prompt");
            return;
        }

        setGenerationStatus('generating');

        let tasks: { id: string, type: 'template' | 'custom', value: string, promptDisplay: string }[] = [];
        if (mode === 'template') {
            tasks = selectedTemplateIds.map(tid => {
                const t = templates.find(temp => temp.id === tid);
                return { id: `pending-${Math.random()}`, type: 'template', value: tid, promptDisplay: t?.name || 'Template' };
            });
        } else {
            tasks = [{ id: `pending-${Math.random()}`, type: 'custom', value: customPrompt, promptDisplay: customPrompt }];
        }

        setPendingGenerations(tasks.map(t => ({ id: t.id, prompt: t.promptDisplay })));
        toast.info(`Started ${tasks.length} generation(s)...`);

        try {
            await Promise.all(tasks.map(async (task) => {
                try {
                    const input = task.type === 'template' ? [task.value] : task.value;
                    // Passing activeImage as override!
                    const result = await generateVariations(project.id, mode, input, activeImage);
                    setPendingGenerations(prev => prev.filter(p => p.id !== task.id));
                    setGenerations(prev => [...(result as Generation[]), ...prev]);
                } catch (err) {
                    console.error("Msg:", err);
                    setPendingGenerations(prev => prev.filter(p => p.id !== task.id));
                }
            }));
            if (mode === 'custom') setCustomPrompt('');
            toast.success("Generation complete");
        } catch (e) {
            toast.error("Generation failed");
        } finally {
            setGenerationStatus('idle');
            setPendingGenerations([]);
        }
    };

    const handleAddToProduct = async (genId: string) => {
        // Find gen
        const gen = generations.find(g => g.id === genId);
        if (!gen) return;

        try {
            // Optimistically update product form? 
            // ProductDetailForm manages its own state. So we should probably refresh the page or use a shared context.
            // For now, simpler: Server action update, then toast "Added to product gallery". 
            // User might need to refresh to see it in the DetailForm.
            const res = await addProductImages(product.id, [gen.imageUrl]);
            if (res.success) {
                toast.success("Added to Product Gallery");
                // Ideally, we trigger a refresh of the ProductDetailForm images
                // But ProductDetailForm is a child component. We'd need to lift state up.
                // For MVP: Just Toast. The user can refresh.
                // Better: We reload the page
                window.location.reload();
            } else {
                toast.error("Failed to add");
            }
        } catch (e) {
            toast.error("Error adding to product");
        }
    };

    // Derived
    const sortedTemplates = useMemo(() => templates, [templates]);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-none p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/products">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{product.title}</h1>
                        <p className="text-xs text-muted-foreground">Product Workspace</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="studio" className="h-full flex flex-col">
                    <div className="px-6 pt-4 border-b">
                        <TabsList>
                            <TabsTrigger value="details">Product Details</TabsTrigger>
                            <TabsTrigger value="studio">Generation Studio</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="details" className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
                        <ProductDetailForm product={product} />
                    </TabsContent>

                    <TabsContent value="studio" className="flex-1 overflow-y-auto p-4 flex flex-col gap-8">
                        {/* 1. Source Image Select */}
                        <div className="max-w-6xl mx-auto w-full space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">1. Select Reference Image</h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                                {product.images.map((img, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "relative w-24 h-24 rounded-lg overflow-hidden border-2 cursor-pointer flex-shrink-0 transition-all",
                                            activeImage === img ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                        onClick={() => setActiveImage(img)}
                                    >
                                        <Image src={img} alt="Product Source" fill className="object-cover" />
                                    </div>
                                ))}
                                {product.images.length === 0 && (
                                    <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                                        No Images
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Controls */}
                        <div className="max-w-6xl mx-auto w-full space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">2. Configure & Generate</h3>

                            <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border bg-card/50">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsTemplatePickerOpen(true)}
                                    className="h-10 relative"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Select Templates
                                    {selectedTemplateIds.length > 0 && mode === 'template' && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">
                                            {selectedTemplateIds.length}
                                        </span>
                                    )}
                                </Button>

                                <div className="flex-1 min-w-[200px]">
                                    <Input
                                        placeholder="Or type a custom prompt..."
                                        value={customPrompt}
                                        onChange={(e) => {
                                            setCustomPrompt(e.target.value);
                                            setMode('custom');
                                        }}
                                        className="h-10"
                                    />
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={generationStatus === 'generating' || (mode === 'template' && selectedTemplateIds.length === 0 && !customPrompt)}
                                    className="h-10 px-6"
                                >
                                    {generationStatus === 'generating' ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                    Generate
                                </Button>
                            </div>
                        </div>

                        {/* 3. Results */}
                        <div className="max-w-[1800px] mx-auto w-full flex-1">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">3. Results</h3>
                            <GenerationGrid
                                images={generations.map(g => ({
                                    id: g.id,
                                    url: g.imageUrl,
                                    templateId: g.templateId || 'custom',
                                    originalImage: g.promptUsed || 'Custom Generation',
                                    prompt: g.promptUsed || customPrompt || 'Custom Generation',
                                    createdAt: g.createdAt
                                }))}
                                isGenerating={generationStatus === 'generating'}
                                selectionMode={isSelectionMode}
                                selectedIds={selectedGenerationIds}
                                onToggle={toggleGenerationSelection}
                                referenceImageUrl={activeImage}
                                referenceName={product.title}
                                defaultProductId={project.defaultProductId}
                                pendingImages={pendingGenerations}
                            // Special prop to inject "Add to Product" specific logic if needed?
                            // Actually GenerationGrid already has "Push to Product" logic if defaultProductId is set.
                            // It calls handleBulkAddToProduct if selection mode is on.
                            // But for single item, we might want a quick action.
                            // We can rely on GenerationGrid's existing hover "Push" button which uses defaultProductId.
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <SelectTemplatesDialog
                open={isTemplatePickerOpen}
                onOpenChange={setIsTemplatePickerOpen}
                templates={sortedTemplates}
                selectedIds={selectedTemplateIds}
                onToggle={(id) => {
                    setSelectedTemplateIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                    setMode('template');
                }}
                onSelectAll={() => setSelectedTemplateIds(sortedTemplates.map(t => t.id))}
                onEdit={() => { }} // No editing in this view for simplicity
                onDelete={() => { }}
                mode={mode}
                onModeChange={setMode}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
            />
        </div>
    );
}
