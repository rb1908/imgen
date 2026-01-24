'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ProductTemplate } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { updateProductTemplate } from '@/app/actions/product_templates';

interface ProductTemplateFormProps {
    template: ProductTemplate;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ProductTemplateForm({ template, onSuccess, onCancel }: ProductTemplateFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(template.name);

    // Parse data safely
    const data = template.data as any || {};

    const [title, setTitle] = useState(data.title || '');
    const [description, setDescription] = useState(data.description || '');
    const [tags, setTags] = useState(data.tags || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const updatedData = {
                ...data,
                title,
                description,
                tags
            };

            const result = await updateProductTemplate(template.id, name, updatedData);

            if (result.success) {
                toast.success('Template updated');
                if (onSuccess) onSuccess();
            } else {
                toast.error('Failed to update template');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer Collection Defaults"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="title">Default Title Pattern</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Handmade Quilt - {Color}"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Default Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Product description template..."
                    rows={4}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="tags">Default Tags</Label>
                <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="comma, separated, tags"
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
