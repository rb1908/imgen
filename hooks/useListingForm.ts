import { useState, useEffect } from 'react';
import { Product } from '@prisma/client';
import { toast } from 'sonner';
import { updateProduct, updateProductVariants, updateProductMetafields } from '@/app/actions/product_actions';
import { updateShopifyProduct, pushProductUpdatesToShopify } from '@/app/actions/shopify';
import { enhancePrompt } from '@/app/actions/enhance';
import { getCategoryAttributes } from '@/app/actions/taxonomy';

export interface ProductWithRelations extends Product {
    options: { id: string; name: string; values: string; position: number }[];
    variants: { id: string; title: string; price: string | null; sku: string | null; inventoryQty: number }[];
    metafields: { id: string; namespace: string; key: string; value: string; type: string }[];
    images: string[];
}

export function useListingForm(product: ProductWithRelations) {
    const [formData, setFormData] = useState({
        title: product.title,
        description: product.description || '',
        price: product.price || '',
        tags: product.tags || '',
        productType: product.productType || '',
        categoryId: product.categoryId || '',
        vendor: product.vendor || '',
        status: 'active'
    });

    const [variants, setVariants] = useState(product.variants);
    const [metafields, setMetafields] = useState(product.metafields);

    // Taxonomy Attributes State
    const [taxonomyAttributes, setTaxonomyAttributes] = useState<any[]>([]);
    const [loadingAttributes, setLoadingAttributes] = useState(false);

    const [isPushing, setIsPushing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [tagInput, setTagInput] = useState('');
    const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
    const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);

    // Sync with product prop changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, title: product.title, description: product.description || '', price: product.price || '', tags: product.tags || '', productType: product.productType || '', vendor: product.vendor || '' }));
        setVariants(product.variants);
        setMetafields(product.metafields);
    }, [product.id]);

    // Fetch Taxonomy Attributes
    useEffect(() => {
        if (!formData.categoryId) {
            setTaxonomyAttributes([]);
            return;
        }
        setLoadingAttributes(true);
        getCategoryAttributes(formData.categoryId)
            .then(attrs => setTaxonomyAttributes(attrs))
            .finally(() => setLoadingAttributes(false));
    }, [formData.categoryId]);

    // Handlers
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedData = { ...formData, images: product.images };
            await updateProduct(product.id, updatedData);
            await updateProductVariants(product.id, variants);
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
            const updatedData = { ...formData, images: product.images };
            await updateProduct(product.id, updatedData);
            await updateProductVariants(product.id, variants);
            await updateProductMetafields(product.id, metafields);

            const coreRes = await updateShopifyProduct({ id: product.id, ...updatedData });
            if (!coreRes.success) throw new Error(coreRes.error);

            const targetId = coreRes.newId || product.id;
            const relRes = await pushProductUpdatesToShopify(targetId, {
                variants: variants.map(v => ({ ...v, id: v.id })),
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

    // Helpers
    const updateVariant = (id: string, field: keyof typeof variants[0], value: any) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const updateMetafield = (id: string, field: keyof typeof metafields[0], value: string) => {
        setMetafields(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const addMetafield = () => {
        setMetafields(prev => [...prev, {
            id: `new_${Date.now()}`,
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

    const getAttributeValue = (handle: string) => {
        return metafields.find(m => m.namespace === 'taxonomy' && m.key === handle)?.value || '';
    };

    const setAttributeValue = (handle: string, value: string) => {
        setMetafields(prev => {
            const existingIndex = prev.findIndex(m => m.namespace === 'taxonomy' && m.key === handle);
            if (existingIndex >= 0) {
                if (!value) return prev.filter((_, i) => i !== existingIndex);
                const copy = [...prev];
                copy[existingIndex] = { ...copy[existingIndex], value };
                return copy;
            } else {
                if (!value) return prev;
                return [...prev, {
                    id: `temp_${Date.now()}_${handle}`,
                    productId: product.id,
                    namespace: 'taxonomy',
                    key: handle,
                    value,
                    type: 'single_line_text_field'
                }];
            }
        });
    };

    return {
        formData, setFormData,
        variants, updateVariant,
        metafields, updateMetafield, addMetafield, removeMetafield,
        taxonomyAttributes, loadingAttributes,
        getAttributeValue, setAttributeValue,
        isPushing, isSaving,
        handleSave, handlePush,
        tagInput, setTagInput, tagsArray, addTag, removeTag, handleTagKeyDown,
        isEnhancingTitle, handleEnhanceTitle,
        isEnhancingDesc, handleEnhanceDesc
    };
}
