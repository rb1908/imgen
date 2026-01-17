
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
import { Loader2, X, ChevronRight, LayoutGrid, Tag, DollarSign, Type, Sparkles, Plus, Image as ImageIcon, ChevronDown, Wand2 } from 'lucide-react';
import { AIIcon } from './icons/AIIcon';
import { cn } from '@/lib/utils';
import { enhancePrompt } from '@/app/actions/enhance';
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
        <div className="border-b border-gray-100 bg-white first:border-t">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 px-6 hover:bg-gray-50/50 transition-colors"
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
                        <div className="px-6 pb-6 pt-0">
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
    onOpenStudio: (imageUrl?: string) => void;
}

export function ListingEditor({ product, onUpdate, onOpenStudio }: ListingEditorProps) {
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description || '',
        price: product.price || '',
        tags: product.tags || '',
        status: 'active'
    });

    const [isPushing, setIsPushing] = useState(false);
    const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
    const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);

    // AI Handlers
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
                {/* Removed padding from container to allow edge-to-edge */}
                <div className="py-0">

                    <div className="space-y-0">
                        {/* Section: Images */}
                        <CollapsibleSection title="Media">
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-3">
                                    {/* Product Images */}
                                    {product.images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onOpenStudio(img)}
                                            className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                                        >
                                            <Image src={img} alt="" fill className="object-cover" />
                                        </button>
                                    ))}

                                    {/* Upload Placeholder */}
                                    <button className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
                                        <Plus className="w-6 h-6" />
                                    </button>

                                    {/* AI Studio Trigger */}
                                    <button
                                        onClick={() => onOpenStudio()}
                                        className="w-20 h-20 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center gap-1 hover:bg-indigo-100 transition-colors text-indigo-600 group"
                                    >
                                        <AIIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-medium">Studio</span>
                                    </button>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Section: Main Info */}
                        <CollapsibleSection title="Product Information">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium text-gray-700">Product Title</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 font-mono pt-1">{formData.title.length}/140</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleEnhanceTitle}
                                                disabled={isEnhancingTitle}
                                                className="h-6 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-[10px] uppercase font-bold tracking-wider"
                                            >
                                                {isEnhancingTitle ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                                Enhance
                                            </Button>
                                        </div>
                                    </div>
                                    <Input
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="bg-transparent border-gray-200 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 transition-all h-10 font-medium px-3 rounded-lg hover:border-gray-300"
                                        placeholder="e.g. Vintage Leather Jacket"
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
                                                className="pl-7 bg-transparent border-gray-200 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 h-10 font-mono rounded-lg hover:border-gray-300"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(val) => setFormData({ ...formData, status: val })}
                                        >
                                            <SelectTrigger className="bg-transparent border-gray-200 h-10 shadow-none focus:ring-0 focus:border-gray-900 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", formData.status === 'active' ? "bg-green-500" : "bg-gray-400")} />
                                                    <SelectValue placeholder="Status" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium text-gray-700">Description</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleEnhanceDesc}
                                            disabled={isEnhancingDesc}
                                            className="h-6 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-[10px] uppercase font-bold tracking-wider"
                                        >
                                            {isEnhancingDesc ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                            Write with AI
                                        </Button>
                                    </div>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="min-h-[150px] w-full resize-none border-gray-200 bg-transparent p-4 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:border-gray-900 rounded-lg transition-all hover:border-gray-300"
                                        placeholder="Detailed product features and benefits..."
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

                                    <div className="p-3 bg-white rounded-xl border border-gray-200 min-h-[100px] flex flex-col gap-2 focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all">
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
