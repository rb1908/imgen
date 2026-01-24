import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2 } from 'lucide-react';
import { CategoryPicker } from '@/components/CategoryPicker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CollapsibleSection } from './CollapsibleSection';

interface MainInfoSectionProps {
    formData: any;
    setFormData: (data: any) => void;
    isEnhancingTitle: boolean;
    onEnhanceTitle: () => void;
    isEnhancingDesc: boolean;
    onEnhanceDesc: () => void;
    // Taxonomy
    loadingAttributes: boolean;
    taxonomyAttributes: any[];
    getAttributeValue: (handle: string) => string;
    setAttributeValue: (handle: string, value: string) => void;
}

export function MainInfoSection({
    formData, setFormData,
    isEnhancingTitle, onEnhanceTitle,
    isEnhancingDesc, onEnhanceDesc,
    loadingAttributes, taxonomyAttributes,
    getAttributeValue, setAttributeValue
}: MainInfoSectionProps) {
    return (
        <CollapsibleSection title="Product Information">
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Product Title</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-mono pt-1">{formData.title.length}/140</span>
                            <Button variant="ghost" size="sm" onClick={onEnhanceTitle} disabled={isEnhancingTitle} className="h-6 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-[10px] uppercase font-bold tracking-wider">
                                {isEnhancingTitle ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />} Enhance
                            </Button>
                        </div>
                    </div>
                    <Textarea value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-transparent border-gray-200 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 transition-all min-h-[5rem] font-medium px-3 py-2 rounded-lg hover:border-gray-300 resize-none leading-normal" placeholder="Title" rows={2} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <CategoryPicker
                            value={formData.categoryId}
                            onChange={(val) => setFormData((prev: any) => ({ ...prev, categoryId: val }))}
                        />
                    </div>
                </div>

                {/* Dynamic Attributes Section */}
                {(loadingAttributes || taxonomyAttributes.length > 0) && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Category Attributes</h4>
                            {loadingAttributes && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span className="text-[10px] font-medium">Fetching available local attributes...</span>
                                </div>
                            )}
                        </div>

                        {!loadingAttributes && (
                            <div className="grid grid-cols-2 gap-4">
                                {taxonomyAttributes.map(attr => (
                                    <div key={attr.id} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm truncate" title={attr.name}>{attr.name}</Label>
                                            {attr.description && (
                                                <Popover>
                                                    <PopoverTrigger asChild><div className="cursor-help text-[10px] text-gray-400 bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center font-bold">?</div></PopoverTrigger>
                                                    <PopoverContent className="w-64 text-xs p-2">{attr.description}</PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                        <Select
                                            value={getAttributeValue(attr.handle)}
                                            onValueChange={(val) => setAttributeValue(attr.handle, val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={`Select ${attr.name}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {attr.options.map((opt: any) => (
                                                    <SelectItem key={opt.id} value={opt.id}>
                                                        {opt.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                        <Label>Product Type (Legacy)</Label>
                        <Input
                            value={formData.productType}
                            onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                            placeholder="e.g. Snowboard"
                        />
                    </div>
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
                        <Button variant="ghost" size="sm" onClick={onEnhanceDesc} disabled={isEnhancingDesc} className="h-6 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-[10px] uppercase font-bold tracking-wider">
                            {isEnhancingDesc ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />} Write with AI
                        </Button>
                    </div>
                    <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="min-h-[150px] w-full resize-none border-gray-200 bg-transparent p-4 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:border-gray-900 rounded-lg transition-all hover:border-gray-300" placeholder="Description..." />
                </div>
            </div>
        </CollapsibleSection>
    );
}
