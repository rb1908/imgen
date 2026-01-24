import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Product } from '@prisma/client';
import { useListingForm, ProductWithRelations } from '@/hooks/useListingForm';
import { MediaSection } from './listing/MediaSection';
import { MainInfoSection } from './listing/MainInfoSection';
import { OrganizationSection } from './listing/OrganizationSection';

interface ListingEditorProps {
    product: ProductWithRelations;
    onUpdate?: (updates: Partial<Product>) => void;
    onOpenStudio: (imageUrl?: string) => void;
}

export function ListingEditor({ product, onUpdate, onOpenStudio }: ListingEditorProps) {
    const {
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
    } = useListingForm(product);

    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-100">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="py-0">
                    <div className="space-y-0">
                        <MediaSection
                            images={product.images}
                            onOpenStudio={onOpenStudio}
                        />

                        <MainInfoSection
                            formData={formData}
                            setFormData={setFormData}
                            isEnhancingTitle={isEnhancingTitle}
                            onEnhanceTitle={handleEnhanceTitle}
                            isEnhancingDesc={isEnhancingDesc}
                            onEnhanceDesc={handleEnhanceDesc}
                            loadingAttributes={loadingAttributes}
                            taxonomyAttributes={taxonomyAttributes}
                            getAttributeValue={getAttributeValue}
                            setAttributeValue={setAttributeValue}
                        />

                        <OrganizationSection
                            formData={formData}
                            setFormData={setFormData}
                            tagsArray={tagsArray}
                            tagInput={tagInput}
                            setTagInput={setTagInput}
                            onAddTag={addTag}
                            onRemoveTag={removeTag}
                            onTagKeyDown={handleTagKeyDown}
                            productOptions={product.options}
                            variants={variants}
                            onUpdateVariant={updateVariant}
                            metafields={metafields}
                            onUpdateMetafield={updateMetafield}
                            onAddMetafield={addMetafield}
                            onRemoveMetafield={removeMetafield}
                        />
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
