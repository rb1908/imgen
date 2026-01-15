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
import { getSignedUploadUrl, getPublicUrl } from '@/app/actions/projects';
import { X, Upload, Loader2 } from 'lucide-react';

export function ProductDetailForm({ product }: { product: Product }) {
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description || '',
        price: product.price || '',
        tags: product.tags || '',
        images: product.images || []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Get Signed URL
            const { signedUrl, path } = await getSignedUploadUrl(file.name, file.type);

            // 2. Upload via Axios (or fetch)
            const axios = (await import('axios')).default;
            await axios.put(signedUrl, file, {
                headers: { 'Content-Type': file.type, 'x-upsert': 'false' }
            });

            // 3. Get Public URL
            const publicUrl = await getPublicUrl(path);

            if (publicUrl) {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, publicUrl]
                }));
                toast.success("Image uploaded (Save to persist)");
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        }
        setIsUploading(false);
        e.target.value = ''; // Reset input
    };

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
                price: formData.price,
                images: formData.images
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
                <div className="aspect-square relative rounded-lg overflow-hidden border bg-muted group">
                    {formData.images[0] ? (
                        <>
                            <Image src={formData.images[0]} alt="Main" fill className="object-cover" />
                            <button
                                onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== 0) })}
                                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove Image"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Main Image</div>
                    )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {formData.images.slice(1).map((img, i) => (
                        <div key={i} className="aspect-square relative rounded-md overflow-hidden border bg-muted group">
                            <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
                            <button
                                onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i + 1) })}
                                className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove Image"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {/* Add Image Button */}
                    <div className="aspect-square relative rounded-md border border-dashed bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center cursor-pointer overflow-hidden">
                        <label className="w-full h-full flex items-center justify-center cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            ) : (
                                <Upload className="w-6 h-6 text-muted-foreground" />
                            )}
                        </label>
                    </div>
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
