'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTemplate, updateTemplate } from '@/app/actions/templates';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Template } from '@prisma/client';
import { cn } from '@/lib/utils';

interface TemplateFormProps {
    template?: Template;
    prompt?: string;
    thumbnailUrl?: string;
    onSuccess: () => void;
    onCancel: () => void;
    className?: string;
}

export function TemplateForm({ template, prompt, thumbnailUrl, onSuccess, onCancel, className }: TemplateFormProps) {
    const isEdit = !!template;
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [currentPrompt, setCurrentPrompt] = useState(template?.prompt || prompt || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('prompt', currentPrompt);
            if (description) formData.append('description', description);
            if (thumbnailUrl) formData.append('thumbnailUrl', thumbnailUrl);
            else if (template?.thumbnailUrl) formData.append('thumbnailUrl', template.thumbnailUrl);

            let result;
            if (isEdit && template) {
                result = await updateTemplate(template.id, formData);
            } else {
                result = await createTemplate(formData);
            }

            if (result.success) {
                toast.success(isEdit ? 'Template updated!' : 'Template saved successfully!');
                onSuccess();
            } else {
                toast.error(result.error || `Failed to ${isEdit ? 'update' : 'save'} template`);
            }
        } catch (error) {
            console.error(error);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={cn("space-y-4 pt-4", className)}>
            <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                    id="name"
                    placeholder="e.g., Neon Cyberpunk City"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                    id="prompt"
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    className="min-h-[100px]"
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                    id="description"
                    placeholder="Brief description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? 'Update Template' : 'Save Template'}
                </Button>
            </div>
        </form>
    );
}
