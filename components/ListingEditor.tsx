
import { useState, useEffect } from 'react';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { updateProduct, updateProductVariants, updateProductMetafields } from '@/app/actions/product_actions';
import { updateShopifyProduct, pushProductUpdatesToShopify } from '@/app/actions/shopify';
import { Loader2, X, ChevronRight, LayoutGrid, Tag, DollarSign, Type, Sparkles, Plus, Image as ImageIcon, ChevronDown, Wand2, Trash2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { enhancePrompt } from '@/app/actions/enhance';

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

// Define types locally or use Prisma generated types (preferred if available)
interface ProductWithRelations extends Product {
    options: { id: string; name: string; values: string; position: number }[];
    variants: { id: string; title: string; price: string | null; sku: string | null; inventoryQty: number }[];
    metafields: { id: string; namespace: string; key: string; value: string; type: string }[];
    images: string[]; // Assuming images is an array of strings
}

interface ListingEditorProps {
    product: ProductWithRelations;
    onUpdate?: (updates: Partial<Product>) => void;
    onOpenStudio: (imageUrl?: string) => void;
}

export function ListingEditor({ product, onUpdate, onOpenStudio }: ListingEditorProps) {
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description || '',
        price: product.price || '',
        tags: product.tags || '',
        productType: product.productType || '',
        vendor: product.vendor || '',
        status: 'active'
    });

    // Editable State for Complex Data
    const [variants, setVariants] = useState(product.variants);
    const [metafields, setMetafields] = useState(product.metafields);
    // Options are read-only for now

    const [isPushing, setIsPushing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Derived state for tags array
    const [tagInput, setTagInput] = useState('');
    const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // AI Handlers (Mocked using toast for now as enhancePrompt is imported but logic is simple)
    const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
    const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);

    const handleEnhanceTitle = async () => {
        if (!formData.title) return;
        setIsEnhancingTitle(true);
        try {
            // Re-use existing enhancePrompt if available, otherwise just mock
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Save Core
            const updatedData = { ...formData, images: product.images };
            await updateProduct(product.id, updatedData);

            // 2. Save Variants (Price/SKU/Stock)
            // Only send if changes? For now send all.
            await updateProductVariants(product.id, variants);

            // 3. Save Metafields
            await updateProductMetafields(product.id, metafields);

            toast.success("Draft saved");
        } catch (e) {
            toast.error("Failed to save draft");
        }
        setIsSaving(false);
    };

    const handlePush = async () => {
        setIsPushing(true);
        try {
            // 1. Save Local First (Core + Relations)
            const updatedData = { ...formData, images: product.images };
            await updateProduct(product.id, updatedData);
            await updateProductVariants(product.id, variants);
            await updateProductMetafields(product.id, metafields);

            // 2. Push Core
            const coreRes = await updateShopifyProduct({ id: product.id, ...updatedData });
            if (!coreRes.success) throw new Error(coreRes.error);

            // 3. Push Relations (Variants + Metafields)
            // Note: If newly created, we need the new Shopify ID?
            // updateShopifyProduct handles swapping IDs locally if created.
            // But we need to know the NEW ID if it changed.
            const targetId = coreRes.newId || product.id;

            const relRes = await pushProductUpdatesToShopify(targetId, {
                variants: variants.map(v => ({ ...v, id: v.id })), // Pass full objects, backend filters what's needed
                metafields: metafields
            });

            if (relRes.success) {
                toast.success("Published to Shopify");
            } else {
                toast.error(relRes.error || "Published core, but failed relations");
            }
        } catch (e) {
            toast.error("Error syncing: " + (e instanceof Error ? e.message : String(e)));
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

    // Variant Helper
    const updateVariant = (id: string, field: keyof typeof variants[0], value: any) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    // Metafield Helper
    const updateMetafield = (id: string, field: keyof typeof metafields[0], value: string) => {
        setMetafields(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const addMetafield = () => {
        setMetafields(prev => [...prev, {
            id: `new_${Date.now()}`, // Temp ID
            productId: product.id,
            namespace: 'custom',
            key: '',
            value: '',
            type: 'single_line_text_field'
        }]);
    };

    const removeMetafield = (id: string) => {
        setMetafields(prev => prev.filter(m => m.id !== id));
    };

    // Update local state if prop changes (Deep comparison or just ID change?)
    useEffect(() => {
        setFormData(prev => ({ ...prev, title: product.title, description: product.description || '', price: product.price || '', tags: product.tags || '', productType: product.productType || '', vendor: product.vendor || '' }));
        // Only update these if incoming product has changed significantly (e.g. initial load or re-sync)
        // Simple check: Length diff or different ID
        // For now, let's assume if product.id changes we reset.
        setVariants(product.variants);
        setMetafields(product.metafields);
    }, [product.id]); // Relaxed dependency to avoid overwriting user edits on minor re-renders. 
    // Ideally we track dirty state, but this is okay for V1.


    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-100">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="py-0">
                    <div className="space-y-0">
                        {/* Section: Images */}
                        <CollapsibleSection title="Media">
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-3">
                                    {product.images.map((img, i) => (
                                        <button key={i} onClick={() => onOpenStudio(img)} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer">
                                            <Image src={img} alt="" fill className="object-cover" />
                                        </button>
                                    ))}
                                    <button className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
                                        <Plus className="w-6 h-6" />
                                    </button>
                                    <button onClick={() => onOpenStudio()} className="w-20 h-20 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center gap-1 hover:bg-indigo-100 transition-colors text-indigo-600 group">
                                        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" /> {/* Assuming AIIcon is Sparkles */}
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
                                            <Button variant="ghost" size="sm" onClick={handleEnhanceTitle} disabled={isEnhancingTitle} className="h-6 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-[10px] uppercase font-bold tracking-wider">
                                                {isEnhancingTitle ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />} Enhance
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-transparent border-gray-200 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 transition-all min-h-[5rem] font-medium px-3 py-2 rounded-lg hover:border-gray-300 resize-none leading-normal" placeholder="Title" rows={2} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Price</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <Input value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="pl-7 bg-transparent border-gray-200 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 h-10 font-mono rounded-lg hover:border-gray-300" placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                                        <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                                            <SelectTrigger className="bg-transparent border-gray-200 h-10 shadow-none focus:ring-0 focus:border-gray-900 rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium text-gray-700">Description</Label>
                                        <Button variant="ghost" size="sm" onClick={handleEnhanceDesc} disabled={isEnhancingDesc} className="h-6 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-[10px] uppercase font-bold tracking-wider">
                                            {isEnhancingDesc ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />} Write with AI
                                        </Button>
                                    </div>
                                    <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="min-h-[150px] w-full resize-none border-gray-200 bg-transparent p-4 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:border-gray-900 rounded-lg transition-all hover:border-gray-300" placeholder="Description..." />
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Section: Organization */}
                        <CollapsibleSection title="Organization" defaultOpen={true}>
                            <div className="space-y-6">
                                {/* Tags */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Tags</Label>
                                    <div className="p-3 bg-white rounded-xl border border-gray-200 min-h-[100px] flex flex-col gap-2 focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all">
                                        <div className="flex flex-wrap gap-2">
                                            {tagsArray.map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs font-normal bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200/50 gap-1 rounded-md transition-colors">
                                                    {tag}
                                                    <button onClick={() => removeTag(i)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-gray-400 h-7" placeholder={tagsArray.length === 0 ? "Add tags..." : "Type and press Enter"} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Product Type</Label>
                                        <Input value={formData.productType} onChange={e => setFormData({ ...formData, productType: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Vendor</Label>
                                        <Input value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} />
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="pt-4 border-t border-gray-100">
                                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Options</Label>
                                    <div className="space-y-2">
                                        {product.options.map((opt) => (
                                            <div key={opt.id} className="bg-gray-50 p-2 rounded border border-gray-100">
                                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{opt.name}</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {opt.values.split(',').map((val, i) => (
                                                        <Badge key={i} variant="outline" className="bg-white text-xs">{val}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {product.options.length === 0 && <div className="text-sm text-gray-400 italic">No options</div>}
                                    </div>
                                </div>

                                {/* Variants */}
                                <div className="pt-4 border-t border-gray-100">
                                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Variants ({variants.length})</Label>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Variant</th>
                                                    <th className="px-3 py-2 text-left w-24">Price</th>
                                                    <th className="px-3 py-2 text-left w-28">SKU</th>
                                                    <th className="px-3 py-2 text-right w-20">Inv</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {variants.map((v) => (
                                                    <tr key={v.id} className="group">
                                                        <td className="px-3 py-2 font-medium text-gray-900 truncate max-w-[120px]" title={v.title}>{v.title}</td>
                                                        <td className="px-2 py-1"><Input value={v.price || ''} onChange={e => updateVariant(v.id, 'price', e.target.value)} className="h-7 text-xs px-2 bg-transparent border-transparent hover:border-gray-200 focus:border-indigo-500 transition-colors text-right" placeholder="-" /></td>
                                                        <td className="px-2 py-1"><Input value={v.sku || ''} onChange={e => updateVariant(v.id, 'sku', e.target.value)} className="h-7 text-xs px-2 bg-transparent border-transparent hover:border-gray-200 focus:border-indigo-500 transition-colors font-mono" placeholder="SKU" /></td>
                                                        <td className="px-2 py-1"><Input type="number" value={v.inventoryQty} onChange={e => updateVariant(v.id, 'inventoryQty', parseInt(e.target.value) || 0)} className="h-7 text-xs px-2 bg-transparent border-transparent hover:border-gray-200 focus:border-indigo-500 transition-colors text-right" placeholder="0" /></td>
                                                    </tr>
                                                ))}
                                                {variants.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">No variants</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Metafields */}
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium text-gray-700">Metafields</Label>
                                        <Button variant="ghost" size="sm" onClick={addMetafield} className="h-6 px-2 text-indigo-600 hover:bg-indigo-50 text-xs"><Plus className="w-3 h-3 mr-1" /> Add Field</Button>
                                    </div>
                                    <div className="space-y-2">
                                        {metafields.map((meta) => (
                                            <div key={meta.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-100 group">
                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                    <Input value={meta.key} onChange={e => updateMetafield(meta.id, 'key', e.target.value)} placeholder="Key (e.g. fabric)" className="h-7 text-xs bg-white" />
                                                    <Input value={meta.value} onChange={e => updateMetafield(meta.id, 'value', e.target.value)} placeholder="Value" className="h-7 text-xs bg-white" />
                                                </div>
                                                <button onClick={() => removeMetafield(meta.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                        {metafields.length === 0 && <div className="text-sm text-gray-400 italic">No custom fields</div>}
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-6 border-t border-gray-100 bg-white flex items-center gap-3">
                <Button variant="outline" className="flex-1 h-12 text-sm font-semibold tracking-wide border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all active:scale-[0.98]" onClick={handleSave} disabled={isSaving || isPushing}>
                    {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Draft"}
                </Button>
                <Button className="flex-[2] h-12 text-sm font-semibold tracking-wide shadow-lg shadow-black/10 bg-black hover:bg-gray-800 text-white rounded-xl transition-all active:scale-[0.98]" onClick={handlePush} disabled={isSaving || isPushing}>
                    {isPushing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</> : "Publish to Shopify"}
                </Button>
            </div>
        </div>
    );
}
