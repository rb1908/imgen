'use client';

import { useState } from 'react';
import { Product, Project, Template, Generation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { VisualCanvas } from './VisualCanvas';
import { ListingEditor } from './ListingEditor';
import { generateVariations } from '@/app/actions/generate';
import { addProductImages, removeProductImage } from '@/app/actions/product_actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AIIcon } from './icons/AIIcon';

// ... imports

interface ProductWithRelations extends Product {
    options: { id: string; name: string; values: string; position: number }[];
    variants: { id: string; title: string; price: string | null; sku: string | null; inventoryQty: number }[];
    metafields: { id: string; namespace: string; key: string; value: string; type: string }[];
}

interface ProductWorkspaceProps {
    product: ProductWithRelations;
    project: any; // Using any for project for now to avoid circular typing hell if not needed
    templates: any[];
}

export function ProductWorkspace({ product: initialProduct, project, templates }: ProductWorkspaceProps) {
    const [product, setProduct] = useState<ProductWithRelations>(initialProduct);
    const [generations, setGenerations] = useState<Generation[]>(project.generations);
    const [activeImage, setActiveImage] = useState<string>(product.images[0] || 'https://placehold.co/800x800?text=No+Image');
    const [isGenerating, setIsGenerating] = useState(false);

    // UI State
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [startViewMode, setStartViewMode] = useState<'gallery' | 'viewer'>('gallery');

    // Handlers
    const handleGenerate = async (mode: 'template' | 'custom', input: string[] | string, referenceImageUrl?: string) => {
        setIsGenerating(true);
        toast.info("Thinking...", { duration: 1000 });

        try {
            // Use referenceImageUrl if provided (AI Studio mode), otherwise activeImage (Editor mode)
            const refImage = referenceImageUrl || activeImage;
            const result = await generateVariations(project.id, mode, input, refImage);
            const newGens = result as Generation[];
            setGenerations(prev => [...newGens, ...prev]);

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
                // Preserve relations when updating from partial response
                setProduct(prev => ({
                    ...prev,
                    ...res.product!,
                    images: res.product!.images
                }));
            } else {
                toast.error("Failed to add image");
            }
        } catch (e) {
            toast.error("Error updating product");
        }
    };

    const handleRemoveImage = async (url: string) => {
        try {
            toast.loading("Removing image...");
            const res = await removeProductImage(product.id, url);
            if (res.success && res.product) {
                const updatedProduct = res.product;
                toast.dismiss();
                toast.success("Image removed");
                // Preserve relations
                setProduct(prev => ({
                    ...prev,
                    ...updatedProduct,
                    images: updatedProduct.images
                }));

                // ...
            } else {
                toast.error("Failed to remove image");
            }
        } catch (e) {
            toast.error("Error removing image");
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
            {/* Minimal Header */}
            <header className="flex-none h-14 border-b flex items-center px-4 justify-between bg-card z-10 w-full overflow-hidden">
                <div className="flex items-center gap-4">
                    <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-accent rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <div className="flex flex-col">
                        <span className="font-semibold text-sm leading-none truncate max-w-[200px]">{product.title}</span>
                        {/* Breadcrumb / Subtitle */}
                    </div>
                </div>
            </header>

            {/* Main Layout - Single View */}
            <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-white">
                <ListingEditor
                    product={product}
                    onOpenStudio={(url) => {
                        if (url) {
                            setActiveImage(url);
                            setStartViewMode('viewer');
                        } else {
                            setStartViewMode('gallery');
                        }
                        setIsStudioOpen(true);
                    }}
                />
            </div>

            {/* Studio Overlay (Full Screen) */}
            <AnimatePresence>
                {isStudioOpen && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-[50] bg-white flex flex-col"
                    >
                        {/* Overlay Header / Controls if needed, usually VisualCanvas has its own or we overlay a close button */}
                        <div className="absolute top-4 right-4 z-[60]">
                            <Button size="icon" variant="ghost" className="rounded-full bg-white/50 hover:bg-white shadow-sm" onClick={() => setIsStudioOpen(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="flex-1 h-full overflow-hidden">
                            <VisualCanvas
                                activeImage={activeImage}
                                onActiveImageChange={setActiveImage}
                                productImages={product.images}
                                generations={generations.map(g => ({ id: g.id, url: g.imageUrl, prompt: g.promptUsed || undefined }))}
                                onGenerate={handleGenerate}
                                onAddToProduct={handleAddToProduct}
                                templates={templates}
                                isGenerating={isGenerating}
                                initialStudioOpen={startViewMode === 'gallery'}
                                initialViewMode={startViewMode}
                                onClose={() => setIsStudioOpen(false)}
                                onRemoveFromProduct={handleRemoveImage}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
