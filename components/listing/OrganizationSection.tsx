import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { VariantsTable } from './VariantsTable';
import { MetafieldsList } from './MetafieldsList';

interface OrganizationSectionProps {
    formData: any;
    setFormData: (data: any) => void;
    // Tags
    tagsArray: string[];
    tagInput: string;
    setTagInput: (val: string) => void;
    onAddTag: () => void;
    onRemoveTag: (idx: number) => void;
    onTagKeyDown: (e: React.KeyboardEvent) => void;
    // Options
    productOptions: any[];
    // Variants
    variants: any[];
    onUpdateVariant: (id: string, field: any, value: any) => void;
    // Metafields
    metafields: any[];
    onUpdateMetafield: (id: string, field: any, value: string) => void;
    onAddMetafield: () => void;
    onRemoveMetafield: (id: string) => void;
}

export function OrganizationSection({
    formData, setFormData,
    tagsArray, tagInput, setTagInput, onAddTag, onRemoveTag, onTagKeyDown,
    productOptions,
    variants, onUpdateVariant,
    metafields, onUpdateMetafield, onAddMetafield, onRemoveMetafield
}: OrganizationSectionProps) {
    return (
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
                                    <button onClick={() => onRemoveTag(i)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                                </Badge>
                            ))}
                        </div>
                        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={onTagKeyDown} className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-gray-400 h-7" placeholder={tagsArray.length === 0 ? "Add tags..." : "Type and press Enter"} />
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
                        {productOptions.map((opt) => (
                            <div key={opt.id} className="bg-gray-50 p-2 rounded border border-gray-100">
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{opt.name}</div>
                                <div className="flex flex-wrap gap-1">
                                    {opt.values.split(',').map((val: string, i: number) => (
                                        <Badge key={i} variant="outline" className="bg-white text-xs">{val}</Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {productOptions.length === 0 && <div className="text-sm text-gray-400 italic">No options</div>}
                    </div>
                </div>

                {/* Variants */}
                <div className="pt-4 border-t border-gray-100">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Variants ({variants.length})</Label>
                    <VariantsTable variants={variants} onUpdate={onUpdateVariant} />
                </div>

                {/* Metafields */}
                <div className="pt-4 border-t border-gray-100">
                    <MetafieldsList
                        metafields={metafields}
                        onUpdate={onUpdateMetafield}
                        onAdd={onAddMetafield}
                        onRemove={onRemoveMetafield}
                    />
                </div>
            </div>
        </CollapsibleSection>
    );
}
