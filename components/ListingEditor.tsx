
import { useState, useEffect, useRef } from 'react';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { updateProduct } from '@/app/actions/product_actions';
import { updateShopifyProduct } from '@/app/actions/shopify';
import {
    Loader2, ArrowRight, X, Plus,
    Tag, DollarSign, Type, FileText,
    Bold, Italic, List, AlignLeft
} from 'lucide-react';
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
    const [titleFocused, setTitleFocused] = useState(false);

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
        <div className="h-full flex flex-col bg-muted/10 border-l relative">
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-6 space-y-6 max-w-lg mx-auto w-full">

                    {/* Header: Title */}
                    <div className={cn(
                        "group relative rounded-xl border bg-card shadow-sm transition-all duration-300 overflow-hidden",
                        titleFocused ? "ring-2 ring-primary/20 border-primary" : "border-border/50 hover:border-border"
                    )}>
                        <div className="absolute top-3 left-3 text-muted-foreground"><Type className="w-4 h-4" /></div>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            onFocus={() => setTitleFocused(true)}
                            onBlur={() => setTitleFocused(false)}
                            className="font-semibold text-lg border-0 focus-visible:ring-0 pl-10 h-auto py-3 bg-transparent"
                            placeholder="Product Title"
                        />
                    </div>

                    {/* Pricing Card */}
                    <Card className="shadow-none border-border/60">
                        <CardContent className="p-4 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5" /> Price
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground group-focus-within:text-foreground transition-colors">$</div>
                                    <Input
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="pl-7 font-mono font-medium border-border/50 bg-muted/5 focus-visible:bg-background transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            {/* Placeholder for future SKU or Stock */}
                            <div className="space-y-2 opacity-50 pointer-events-none grayscale">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    Compare At
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">$</div>
                                    <Input placeholder="0.00" className="pl-7 border-border/50 bg-muted/5" disabled />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata Card (Tags) */}
                    <Card className="shadow-none border-border/60">
                        <CardHeader className="p-4 pb-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" /> Tags
                            </Label>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="min-h-[50px] p-2 rounded-lg border border-input/40 bg-muted/5 flex flex-wrap gap-2 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                                {tagsArray.map((tag, i) => (
                                    <Badge key={i} variant="outline" className="px-2 py-0.5 h-7 font-normal text-sm gap-1 bg-background hover:bg-muted transition-colors pr-1">
                                        {tag}
                                        <button onClick={() => removeTag(i)} className="rounded-full hover:bg-destructive hover:text-destructive-foreground p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                                    </Badge>
                                ))}
                                <input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/40 min-w-[80px] h-7"
                                    placeholder={tagsArray.length === 0 ? "Add a tag..." : ""}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 ml-1">
                                Press <kbd className="font-mono bg-muted px-1 rounded border">Enter</kbd> to add.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Description Card with "Rich Text" Toolbar */}
                    <Card className="shadow-none border-border/60 overflow-hidden flex flex-col h-[400px]">
                        <div className="px-4 py-3 border-b bg-muted/10 flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Description
                            </Label>
                            {/* Fake Toolbar */}
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><Bold className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><Italic className="w-3 h-3" /></Button>
                                <div className="w-px h-3 bg-border mx-1" />
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><List className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><AlignLeft className="w-3 h-3" /></Button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="h-full w-full resize-none border-0 rounded-none bg-card p-4 text-sm leading-relaxed focus-visible:ring-0 placeholder:text-muted-foreground/30 font-sans"
                                placeholder="Describe your product details, materials, and care instructions..."
                            />
                        </div>
                    </Card>

                </div>
            </div>

            {/* Bottom Action Bar - Sticky */}
            <div className="p-4 border-t bg-background/80 backdrop-blur-xl sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col gap-3 max-w-lg mx-auto">
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground px-1">
                        <span className="flex items-center gap-2">
                            <span className={cn("inline-block w-1.5 h-1.5 rounded-full", isPushing ? "bg-amber-400 animate-pulse" : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]")} />
                            {product.updatedAt ? `Synced ${new Date(product.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not synced'}
                        </span>
                        <span>Shopify Ready</span>
                    </div>
                    <Button
                        className="w-full h-11 text-sm font-semibold tracking-wide shadow-md transition-all active:scale-[0.98] bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={handlePush}
                        disabled={isPushing}
                    >
                        {isPushing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Publishing...
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
