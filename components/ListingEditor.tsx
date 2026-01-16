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
    });

    const [isPushing, setIsPushing] = useState(false);

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

    return (
        <div className="h-full flex flex-col bg-card border-l">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* General Section */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Title</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="text-lg font-medium px-3 py-6"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Price</Label>
                        <Input
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            className="max-w-[150px]"
                        />
                    </div>
                </div>

                {/* Divider - Metadata */}
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground tracking-wider">Metadata</span></div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Tags</Label>
                        <Input
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="vintage, handmade, ceramic..."
                            className="bg-muted/30"
                        />
                        <p className="text-[10px] text-muted-foreground">Comma separated keywords for SEO.</p>
                    </div>
                </div>

                {/* Divider - Description */}
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground tracking-wider">Description</span></div>
                </div>

                <div className="space-y-2 h-full min-h-[300px]">
                    {/* Note editor style for Textarea */}
                    <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[300px] resize-none border-border/50 bg-muted/10 p-4 leading-relaxed focus-visible:ring-1 focus-visible:ring-offset-0"
                        placeholder="Describe your product..."
                    />
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-center text-[10px] text-muted-foreground mb-3 text-center">
                    <span>
                        {product.updatedAt ? `Synced ${new Date(product.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not synced'}
                    </span>
                </div>
                <Button
                    className="w-full h-12 text-base font-semibold shadow-md bg-black text-white hover:bg-black/90"
                    size="lg"
                    onClick={handlePush}
                    disabled={isPushing}
                >
                    {isPushing ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Publishing...
                        </>
                    ) : (
                        "Publish to Shopify"
                    )}
                </Button>
            </div>
        </div>
    );
}
