
import { useState, useEffect } from 'react';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { updateProduct } from '@/app/actions/product_actions';
import { updateShopifyProduct } from '@/app/actions/shopify';
import { Loader2, X, ChevronRight, LayoutGrid, Tag, DollarSign, Type, Sparkles, Plus, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
                <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-200", isOpen ? "transform rotate-180" : "")} />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-4 border-t border-gray-100">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface ListingEditorProps {
    product: Product;
    onUpdate?: (updates: Partial<Product>) => void;
    onOpenStudio: () => void;
}

export function ListingEditor({ product, onUpdate, onOpenStudio }: ListingEditorProps) {
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description || '',
        price: product.price || '',
        tags: product.tags || '',
        status: 'active' // Adding a mock status field for the Ecomiq look
    });

    const [isPushing, setIsPushing] = useState(false);

    // Derived state for tags array
    const [tagInput, setTagInput] = useState('');
    const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Update local state if prop changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            title: product.title,
            description: product.description || '',
            price: product.price || '',
            tags: product.tags || '',
        }));
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
        <div className="h-full flex flex-col bg-white border-l border-gray-100">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">

                    <div className="space-y-6">
                        {/* Section: Images */}
                        <CollapsibleSection title="Media">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">Product Images</Label>
                                <div className="flex flex-wrap gap-3">
                                    {/* Product Images */}
                                    {product.images.map((img, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                            <Image src={img} alt="" fill className="object-cover" />
                                        </div>
                                    ))}

                                    {/* Upload Placeholder */}
                                    <button className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
                                        <Plus className="w-6 h-6" />
                                    </button>

                                    {/* AI Studio Trigger */}
                                    <button
                                        onClick={onOpenStudio}
                                        className="w-20 h-20 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center gap-1 hover:bg-indigo-100 transition-colors text-indigo-600 group"
                                    >
                                        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-medium">AI Studio</span>
                                    </button>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Section: Main Info */}
                        <CollapsibleSection title="Product Information">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-gray-700">Product Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="bg-gray-50/50 border-gray-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black/5 transition-all h-10"
                                        placeholder="Short Sleeve T-Shirt"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Price</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <Input
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                className="pl-7 bg-gray-50/50 border-gray-200 focus-visible:bg-white focus-visible:ring-black/5 h-10"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                                        <Select defaultValue="active">
                                            <SelectTrigger className="bg-gray-50/50 border-gray-200 h-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    <SelectValue placeholder="Status" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5 pt-2">
                                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="min-h-[150px] w-full resize-none border-gray-200 bg-gray-50/30 p-4 text-sm leading-relaxed focus-visible:bg-white focus-visible:ring-black/5 rounded-xl transition-all"
                                        placeholder="Write a product description..."
                                    />
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Section: Category/Organization */}
                        <CollapsibleSection title="Organization" defaultOpen={false}>
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium text-gray-700">Tags</Label>
                                    </div>

                                    <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm min-h-[100px] flex flex-col gap-2">
                                        <div className="flex flex-wrap gap-2">
                                            {tagsArray.map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs font-normal bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200/50 gap-1 rounded-md transition-colors">
                                                    {tag}
                                                    <button onClick={() => removeTag(i)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-gray-400 h-7"
                                            placeholder={tagsArray.length === 0 ? "Add tags..." : "Type and press Enter"}
                                        />
                                    </div>
                                </div>

                                {/* Mock Category Selection */}
                                <div className="space-y-1.5 opacity-60 hover:opacity-100 transition-opacity">
                                    <Label className="text-sm font-medium text-gray-700">Vendor</Label>
                                    <Select disabled>
                                        <SelectTrigger className="bg-gray-50/50 border-gray-200 h-10">
                                            <SelectValue placeholder="Select Vendor (Shopify)" />
                                        </SelectTrigger>
                                    </Select>
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-6 border-t border-gray-100 bg-white">
                <Button
                    className="w-full h-12 text-sm font-semibold tracking-wide shadow-lg shadow-orange-500/20 bg-[#FF6B35] hover:bg-[#F55F2A] text-white rounded-xl transition-all active:scale-[0.98]"
                    onClick={handlePush}
                    disabled={isPushing}
                >
                    {isPushing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Syncing...
                        </>
                    ) : (
                        "Save to Shopify"
                    )}
                </Button>
            </div>
        </div>
    );
}
