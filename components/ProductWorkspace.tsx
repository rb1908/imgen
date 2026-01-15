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
        <div className="h-screen flex flex-col bg-background">
            {/* Minimal Header */}
            <header className="flex-none h-14 border-b flex items-center px-4 justify-between bg-card z-10">
                <div className="flex items-center gap-4">
                    <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm leading-none">{product.title}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Studio</span>
                    </div>
                </div>
                <div>
                    {/* Maybe status or secondary actions here */}
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Visual Canvas (65% Desktop, Top Mobile) */}
                <div className="flex-1 md:flex-[1.8] h-[50vh] md:h-full relative order-1">
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

                {/* Listing Editor (35% Desktop, Bottom Mobile) */}
                <div className="flex-1 md:flex-1 h-full border-l overflow-hidden bg-card order-2">
                    <ListingEditor
                        product={product}
                    />
                </div>
            </div>
        </div>
    );
}
