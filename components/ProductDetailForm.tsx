'use client';

import { useState } from 'react';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateProduct } from '@/app/actions/product_actions'; // We need to create this
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

import { updateShopifyProduct } from '@/app/actions/shopify';

export function ProductDetailForm({ product }: { product: Product }) {
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description || '',
        price: product.price || '',
        tags: product.tags || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isPushing, setIsPushing] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProduct(product.id, formData);
            toast.success("Product updated locally");
        } catch (e) {
            toast.error("Failed to update");
        }
        setIsSaving(false);
    };

    const handlePush = async () => {
        setIsPushing(true);
        try {
            // First save locally ensures DB is consistent
            await updateProduct(product.id, formData);

            const res = await updateShopifyProduct({
                id: product.id,
                title: formData.title,
                description: formData.description,
                tags: formData.tags,
                price: formData.price
            });

            if (res.success) {
                toast.success("Synced to Shopify!");
            } else {
                toast.error(res.error || "Failed to push to Shopify");
            }
        } catch (e) {
            toast.error("Error syncing");
        }
        setIsPushing(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Images */}
            <div className="space-y-4">
                <div className="aspect-square relative rounded-lg overflow-hidden border bg-muted">
                    {product.images[0] ? (
                        <Image src={product.images[0]} alt="Main" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">No Image</div>
                    )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {product.images.slice(1).map((img: string, i: number) => (
                        <div key={i} className="aspect-square relative rounded-md overflow-hidden border bg-muted">
                            <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Form */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label>Product Title</Label>
                    <Input
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                        value={formData.tags}
                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    />
                    <div className="text-xs text-muted-foreground">Comma separated</div>
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={10}
                    />
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Last synced: {new Date(product.updatedAt).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                        <Button disabled={isSaving || isPushing} onClick={handleSave} variant="secondary">
                            {isSaving ? "Saving..." : "Save Local"}
                        </Button>
                        <Button disabled={isSaving || isPushing} onClick={handlePush}>
                            {isPushing ? "Pushing..." : "Sync to Shopify"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
