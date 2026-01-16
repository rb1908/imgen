'use client';


import { useState, useEffect, useRef } from 'react';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { updateProduct } from '@/app/actions/product_actions';
import { updateShopifyProduct } from '@/app/actions/shopify';
import { Loader2, ArrowRight, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingEditorProps {
    product: Product;
    onUpdate?: (updates: Partial<Product>) => void;
}

export function ListingEditor({ product, onUpdate }: ListingEditorProps) {
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description || '',
        price: product.price || '',
        tags: product.tags || '',
    });

    const [isPushing, setIsPushing] = useState(false);

    // Derived state for tags array
    const [tagInput, setTagInput] = useState('');
    const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Update local state if prop changes
    useEffect(() => {
        setFormData({
            title: product.title,
            description: product.description || '',
            price: product.price || '',
            tags: product.tags || '',
        });
    }, [product]);

    const handlePush = async () => {
        setIsPushing(true);
        try {
            // 1. Save Local + Sync
            const updatedData = { ...formData, images: product.images };
            await updateProduct(product.id, updatedData);
            const res = await updateShopifyProduct({ id: product.id, ...updatedData });

            if (res.success) {
                toast.success("Published to Shopify");
            } else {
                toast.error(res.error || "Failed to publish");
            }
        } catch (e) {
            toast.error("Error syncing");
        }
        setIsPushing(false);
    };

    // Tag Handlers
    const addTag = () => {
        if (!tagInput.trim()) return;
        const newTags = [...tagsArray, tagInput.trim()];
        setFormData({ ...formData, tags: newTags.join(', ') });
        setTagInput('');
    };

    const removeTag = (indexToRemove: number) => {
        const newTags = tagsArray.filter((_, i) => i !== indexToRemove);
        setFormData({ ...formData, tags: newTags.join(', ') });
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !tagInput && tagsArray.length > 0) {
            removeTag(tagsArray.length - 1);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background border-l"> {/* Main bg changed to background for cleaner look */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8 max-w-lg mx-auto w-full"> {/* Centered max-w for readability on large screens */}

                    {/* Section: Essentials */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground ml-1">Title</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="font-medium text-base border-input/50 focus-visible:border-ring focus-visible:ring-0 bg-transparent px-3 py-5 shadow-sm transition-colors"
                                placeholder="Product Title"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground ml-1">Price</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                    <Input
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="pl-6 font-medium border-input/50 focus-visible:border-ring focus-visible:ring-0 bg-transparent shadow-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            {/* Potential spot for Quantity or SKU */}
                        </div>
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Section: Organization (Tags) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground ml-1">Tags</Label>
                            {/* <span className="text-[10px] text-muted-foreground opacity-70">Press Enter</span> */}
                        </div>

                        <div className="min-h-[80px] p-3 rounded-lg border border-input/50 bg-muted/5 space-y-3 focus-within:ring-1 focus-within:ring-ring transition-all">
                            <div className="flex flex-wrap gap-2">
                                {tagsArray.map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="px-2 py-1 font-normal text-sm gap-1 hover:bg-slate-200 transition-colors">
                                        {tag}
                                        <button onClick={() => removeTag(i)} className="rounded-full hover:bg-black/10 p-0.5"><X className="w-3 h-3" /></button>
                                    </Badge>
                                ))}
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    className="border-0 shadow-none focus-visible:ring-0 p-0 h-7 w-24 min-w-[60px] flex-1 bg-transparent placeholder:text-muted-foreground/50 text-sm"
                                    placeholder={tagsArray.length === 0 ? "Add tags..." : ""}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground px-1">Keywords for search optimization.</p>
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Section: Content (Description) */}
                    <div className="space-y-1.5 h-full">
                        <Label className="text-xs font-medium text-muted-foreground ml-1">Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[300px] w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 focus-visible:ring-0 placeholder:text-muted-foreground/40"
                            placeholder="Write a product description..."
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar - Sticky */}
            <div className="p-4 border-t bg-background/80 backdrop-blur-md sticky bottom-0 z-10">
                <div className="flex flex-col gap-3 max-w-lg mx-auto">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                        <span>{product.updatedAt ? `Synced ${new Date(product.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not yet synced'}</span>
                        <span className={cn("inline-block w-2 h-2 rounded-full", isPushing ? "bg-yellow-400 animate-pulse" : "bg-green-500")} />
                    </div>
                    <Button
                        className="w-full h-11 text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
                        onClick={handlePush}
                        disabled={isPushing}
                    >
                        {isPushing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Publishing to Shopify...
                            </>
                        ) : (
                            "Publish Changes"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
