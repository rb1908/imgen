'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTemplate, updateTemplate } from '@/app/actions/templates';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Template } from '@prisma/client';

interface TemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    prompt?: string;
    thumbnailUrl?: string;
    template?: Template; // If provided, we are in Edit mode
}

export function TemplateDialog({ open, onOpenChange, prompt, thumbnailUrl, template }: TemplateDialogProps) {
    const isEdit = !!template;
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [currentPrompt, setCurrentPrompt] = useState(template?.prompt || prompt || '');
    const [loading, setLoading] = useState(false);

    // Reset form when opening/switching modes
    useEffect(() => {
        if (open) {
            if (template) {
                setName(template.name);
                setDescription(template.description || '');
                setCurrentPrompt(template.prompt);
            } else {
                setName('');
                setDescription('');
                setCurrentPrompt(prompt || '');
            }
        }
    }, [open, template, prompt]);

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
            // Use the passed thumbnailUrl (from new save) OR existing template thumbnail
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
                onOpenChange(false);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Template' : 'Save as Template'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Modify your existing template details.' : 'Save this prompt to your library for future use.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Update Template' : 'Save Template'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
