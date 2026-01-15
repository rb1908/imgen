'use client';

import { useState, useEffect } from 'react';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateProduct } from '@/app/actions/product_actions';
import { updateShopifyProduct } from '@/app/actions/shopify';
import { Loader2, ArrowRight } from 'lucide-react';

interface ListingEditorProps {
    product: Product;
    // We might need to lift state up if we want Workspace to control everything,
    // but for now, let's keep form state local + prop updates.
    onUpdate?: (updates: Partial<Product>) => void;
}

export function ListingEditor({ product, onUpdate }: ListingEditorProps) {
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description || '',
        price: product.price || '',
        tags: product.tags || '',
        // Images are managed by Parent/Canvas, but we need them for sync. 
        // We'll trust that `product.images` passed in props is up to date 
        // OR we should accept images as a separate prop if they change frequently.
        // For sync, we use the PROPS product images.
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isPushing, setIsPushing] = useState(false);

    // Update local state if prop changes (e.g. if we switch products or parent updates)
    useEffect(() => {
        setFormData({
            title: product.title,
            description: product.description || '',
            price: product.price || '',
            tags: product.tags || '',
        });
    }, [product]);

    // Auto-save on blur or debounce could be nice, but explicit "Sync" is requested.
    // We'll keep explicit save/sync for now to be safe, but maybe auto-save local?

    const handlePush = async () => {
        setIsPushing(true);
        try {
            // 1. Save Local First
            const updatedData = {
                ...formData,
                images: product.images // Use current images from prop
            };

            await updateProduct(product.id, updatedData);

            // 2. Sync to Shopify
            const res = await updateShopifyProduct({
                id: product.id,
                ...updatedData
            });

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

    return (
        <div className="h-full flex flex-col bg-card border-l">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg tracking-tight">Listing Details</h3>

                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="font-medium text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</Label>
                        <Input
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</Label>
                        <Input
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="vintage, handmade, ceramic..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[200px] resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>
                        {product.updatedAt ? `Last saved ${new Date(product.updatedAt).toLocaleTimeString()}` : 'Not saved'}
                    </span>
                    <span>Ready to publish</span>
                </div>
                <Button
                    className="w-full h-12 text-base font-semibold shadow-xl"
                    size="lg"
                    onClick={handlePush}
                    disabled={isPushing}
                >
                    {isPushing ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Syncing...
                        </>
                    ) : (
                        <>
                            Sync to Shopify
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
