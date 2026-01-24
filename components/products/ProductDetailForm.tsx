'use client';

import { useState, useRef, useEffect } from 'react';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateProduct } from '@/app/actions/product_actions';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { updateShopifyProduct } from '@/app/actions/shopify';
import { getSignedUploadUrl, getPublicUrl } from '@/app/actions/projects';
import { X, Upload, Loader2, Wand2, RefreshCcw, Save, Share2, Tag, DollarSign, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { enhancePrompt } from '@/app/actions/enhance';
import { cn } from '@/lib/utils';

export function ProductDetailForm({ product }: { product: Product }) {
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description || '',
        price: product.price || '',
        tags: product.tags || '',
        images: product.images || []
    });

    const [tagInput, setTagInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
    const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);

    // Derived state for tags
    const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const loadingId = toast.loading("Uploading image...");
        try {
            const { signedUrl, path } = await getSignedUploadUrl(file.name, file.type);
            const axios = (await import('axios')).default;
            await axios.put(signedUrl, file, { headers: { 'Content-Type': file.type, 'x-upsert': 'false' } });
            const publicUrl = await getPublicUrl(path);

            if (publicUrl) {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, publicUrl]
                }));
                toast.success("Image added", { id: loadingId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload failed", { id: loadingId });
        }
        setIsUploading(false);
        e.target.value = '';
    };

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        if (!silent) toast.loading("Saving changes...", { id: "save-toast" });
        try {
            await updateProduct(product.id, formData);
            if (!silent) toast.success("Saved to database", { id: "save-toast" });
        } catch (e) {
            if (!silent) toast.error("Failed to save", { id: "save-toast" });
        }
        setIsSaving(false);
    };

    const handlePush = async () => {
        setIsPushing(true);
        toast.loading("Syncing to Shopify...", { id: "push-toast" });
        try {
            await updateProduct(product.id, formData); // Auto-save first
            const res = await updateShopifyProduct({
                id: product.id,
                title: formData.title,
                description: formData.description,
                tags: formData.tags,
                price: formData.price,
                images: formData.images
            });

            if (res.success) {
                toast.success("Synced to Shopify!", { id: "push-toast" });
            } else {
                toast.error(res.error || "Failed to push", { id: "push-toast" });
            }
        } catch (e) {
            toast.error("Sync failed", { id: "push-toast" });
        }
        setIsPushing(false);
    };

    // AI Enhance Handlers
    const handleEnhanceTitle = async () => {
        if (!formData.title) return;
        setIsEnhancingTitle(true);
        try {
            const { enhancedPrompt } = await enhancePrompt(`Optimize this product title for SEO and sales (keep under 80 chars): ${formData.title}`);
            if (enhancedPrompt) setFormData(prev => ({ ...prev, title: enhancedPrompt.replace(/^"|"$/g, '') }));
            toast.success("Title optimized");
        } catch (e) { toast.error("Failed to enhance"); }
        setIsEnhancingTitle(false);
    };

    const handleEnhanceDesc = async () => {
        if (!formData.description) return;
        setIsEnhancingDesc(true);
        try {
            const { enhancedPrompt } = await enhancePrompt(`Write a compelling, SEO-friendly ecommerce product description based on: ${formData.description}. Keep it engaging and highlight key features.`);
            if (enhancedPrompt) setFormData(prev => ({ ...prev, description: enhancedPrompt }));
            toast.success("Description enhanced");
        } catch (e) { toast.error("Failed to enhance"); }
        setIsEnhancingDesc(false);
    };

    // Tag Handlers
    const addTag = () => {
        if (!tagInput.trim()) return;
        const newTags = [...tagsArray, tagInput.trim()].join(', ');
        setFormData(prev => ({ ...prev, tags: newTags }));
        setTagInput('');
    };

    const removeTag = (index: number) => {
        const newTags = tagsArray.filter((_, i) => i !== index).join(', ');
        setFormData(prev => ({ ...prev, tags: newTags }));
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            {/* Top Stats / Metadata */}
            <div className="flex items-center justify-between px-1">
                <div className="text-sm text-muted-foreground">
                    Imported {new Date(product.syncedAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={isSaving || isPushing}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button size="sm" onClick={handlePush} disabled={isSaving || isPushing} className="bg-[#94d500] hover:bg-[#82bd00] text-black border-none font-medium">
                        <Share2 className="w-4 h-4 mr-2" />
                        {isPushing ? "Syncing..." : "Push to Shopify"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                            <CardDescription>Manage title and description for your store listing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-medium">Title</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleEnhanceTitle}
                                        disabled={isEnhancingTitle}
                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8"
                                    >
                                        {isEnhancingTitle ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Wand2 className="w-3 h-3 mr-2" />}
                                        AI Enhance
                                    </Button>
                                </div>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="text-lg font-medium"
                                    placeholder="e.g. Vintage Leather Jacket"
                                />
                                <p className="text-xs text-muted-foreground text-right">{formData.title.length} chars</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-medium">Description</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleEnhanceDesc}
                                        disabled={isEnhancingDesc}
                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8"
                                    >
                                        {isEnhancingDesc ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Wand2 className="w-3 h-3 mr-2" />}
                                        AI Writer
                                    </Button>
                                </div>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={12}
                                    className="leading-relaxed"
                                    placeholder="Describe your product in detail..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Media</CardTitle>
                            <CardDescription>Drag to reorder not yet implemented, but you can manage images here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {/* Upload Button */}
                                <label className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-colors">
                                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                                    <span className="text-xs text-muted-foreground mt-2 font-medium">Add Image</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                </label>

                                {formData.images.map((img, i) => (
                                    <div key={i} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                        <Image src={img} alt="" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            {i === 0 && <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Main</span>}
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Organization */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Tags</Label>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 min-h-10 border rounded-md bg-background focus-within:ring-2 ring-ring">
                                    {tagsArray.map((tag, i) => (
                                        <Badge key={i} variant="secondary" className="px-1.5 h-6 text-xs flex items-center gap-1">
                                            {tag}
                                            <X
                                                className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                onClick={() => removeTag(i)}
                                            />
                                        </Badge>
                                    ))}
                                    <input
                                        className="flex-1 bg-transparent outline-none text-sm min-w-[3rem]"
                                        placeholder={tagsArray.length === 0 ? "Add tags..." : ""}
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault();
                                                addTag();
                                            }
                                            if (e.key === 'Backspace' && !tagInput && tagsArray.length > 0) {
                                                removeTag(tagsArray.length - 1);
                                            }
                                        }}
                                        onBlur={addTag}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Press Enter or Comma to add tags</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
