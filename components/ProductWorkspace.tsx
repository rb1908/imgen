'use client';

import { useState } from 'react';
import { Product, Project, Template, Generation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { VisualCanvas } from './VisualCanvas';
import { ListingEditor } from './ListingEditor';
import { generateVariations } from '@/app/actions/generate';
import { addProductImages } from '@/app/actions/product_actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductWorkspaceProps {
    product: Product;
    project: Project & { generations: Generation[] };
    templates: Template[];
}

export function ProductWorkspace({ product: initialProduct, project, templates }: ProductWorkspaceProps) {
    const [product, setProduct] = useState(initialProduct);
    const [generations, setGenerations] = useState<Generation[]>(project.generations);
    const [activeImage, setActiveImage] = useState<string>(product.images[0] || 'https://placehold.co/800x800?text=No+Image');
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'studio' | 'details'>('studio');

    // Handlers
    const handleGenerate = async (mode: 'template' | 'custom', input: string[] | string) => {
        setIsGenerating(true);
        toast.info("Thinking...", { duration: 1000 }); // "Canva" feel

        try {
            // Use activeImage as the reference
            const result = await generateVariations(project.id, mode, input, activeImage);
            const newGens = result as Generation[];
            setGenerations(prev => [...newGens, ...prev]);

            // Auto-select the first new generation? 
            if (newGens.length > 0 && newGens[0].imageUrl) {
                setActiveImage(newGens[0].imageUrl);
                toast.success("Generated!");
            }
        } catch (e) {
            console.error(e);
            toast.error("Generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddToProduct = async (url: string) => {
        if (product.images.includes(url)) return;

        try {
            toast.loading("Adding to listing...");
            const res = await addProductImages(product.id, [url]);

            if (res.success && res.product) {
                toast.dismiss();
                toast.success("Added to Listing");
                setProduct(res.product); // Update local product state to reflect new image
            } else {
                toast.error("Failed to add image");
            }
        } catch (e) {
            toast.error("Error updating product");
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-background overflow-hidden overscroll-none touch-pan-y">
            {/* Minimal Header */}
            <header className="flex-none h-14 border-b flex items-center px-4 justify-between bg-card z-10 w-full overflow-hidden">
                <div className="flex items-center gap-4">
                    <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-accent rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    {/* Mobile Tab Switcher */}
                    <div className="md:hidden flex bg-muted/50 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('studio')}
                            className={cn(
                                "text-xs font-medium px-4 py-1.5 rounded-md transition-all",
                                activeTab === 'studio' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Images
                        </button>
                        <button
                            onClick={() => setActiveTab('details')}
                            className={cn(
                                "text-xs font-medium px-4 py-1.5 rounded-md transition-all",
                                activeTab === 'details' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Details
                        </button>
                    </div>

                    <div className="hidden md:flex flex-col">
                        <span className="font-semibold text-sm leading-none truncate max-w-[200px]">{product.title}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Images Workspace</span>
                    </div>
                </div>
                <div>
                    {/* Maybe status or secondary actions here */}
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative w-full">
                {/* Visual Canvas (Mobile: Tab A, Desktop: Left Pane) */}
                <div className={cn(
                    "flex-1 md:flex-none md:w-[65%] h-full relative order-1",
                    // Mobile visibility logic
                    activeTab === 'studio' ? "block" : "hidden md:block" // Hidden on mobile if not active tab, always visible on desktop
                )}>
                    <VisualCanvas
                        activeImage={activeImage}
                        onActiveImageChange={setActiveImage}
                        productImages={product.images}
                        generations={generations.map(g => ({ id: g.id, url: g.imageUrl, prompt: g.promptUsed || undefined }))}
                        onGenerate={handleGenerate}
                        onAddToProduct={handleAddToProduct}
                        templates={templates}
                        isGenerating={isGenerating}
                    />
                </div>

                {/* Listing Editor (Mobile: Tab B, Desktop: Right Pane) */}
                <div className={cn(
                    "flex-1 md:flex-none md:w-[35%] h-full border-l overflow-hidden bg-white order-2 z-20 shadow-md",
                    // Mobile visibility logic
                    activeTab === 'details' ? "block" : "hidden md:block"
                )}>
                    <ListingEditor
                        product={product}
                    />
                </div>
            </div>
        </div>
    );
}
