'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Save, Edit3, Tag as TagIcon, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface MetadataEditorProps {
    initialDescription?: string | null;
    initialTags?: string | null;
    initialPrice?: string | null;
    onSave: (data: { description: string; tags: string; price: string }) => Promise<void>;
}

export function MetadataEditor({ initialDescription, initialTags, initialPrice, onSave }: MetadataEditorProps) {
    const [description, setDescription] = useState(initialDescription || '');
    const [tagsInput, setTagsInput] = useState(initialTags || '');
    const [price, setPrice] = useState(initialPrice || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({ description, tags: tagsInput, price });
            setIsEditing(false);
            toast.success("Metadata updated!");
        } catch (e) {
            toast.error("Failed to update metadata");
        }
        setIsSaving(false);
    };

    const tagsList = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    if (!isEditing) {
        return (
            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Listing Details</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </div>

                <div className="space-y-4">
                    {/* Price */}
                    <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{price || 'No price set'}</span>
                    </div>

                    {/* Tags */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <TagIcon className="w-4 h-4" />
                            <span>Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tagsList.length > 0 ? (
                                tagsList.map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="px-2 py-1">
                                        {tag}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground italic">No tags</span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground font-medium mb-1">Description</p>
                        <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {description || <span className="text-muted-foreground italic">No description</span>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Details</h3>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save</>}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Price</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className="pl-8"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Tags (comma separated)</Label>
                    <Input
                        value={tagsInput}
                        onChange={e => setTagsInput(e.target.value)}
                        placeholder="modern, summer, sale"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={10}
                        placeholder="Product description..."
                        className="resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
