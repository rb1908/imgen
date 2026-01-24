'use client';

import { useState } from 'react';
import { Template } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TemplateItem } from './TemplateItem';
import { TemplateDialog } from './TemplateDialog';
import { deleteTemplate } from '@/app/actions/templates';
import { toast } from 'sonner';

interface TemplatesListProps {
    templates: (Template & { generations: { imageUrl: string }[] })[];
    type: 'prompt' | 'social';
}

export function TemplatesList({ templates, type }: TemplatesListProps) {
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleDelete = async (id: string) => {
        if (confirm("Delete this template?")) {
            const res = await deleteTemplate(id);
            if (res.success) {
                toast.success("Template deleted");
            } else {
                toast.error("Failed to delete template");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                {type === 'prompt' && (
                    <Button onClick={() => setIsCreating(true)} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Prompt
                    </Button>
                )}
                {/* Social Templates are typically created from the Studio, but we could add a manual creator later */}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {templates.map((template) => (
                    <TemplateItem
                        key={template.id}
                        template={template}
                        isSelected={false}
                        onToggle={() => setEditingTemplate(template)}
                        onEdit={setEditingTemplate}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {/* Reuse TemplateDialog for Prompts. For Social, we might need a different one later. */}
            {type === 'prompt' && (
                <TemplateDialog
                    open={isCreating || !!editingTemplate}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsCreating(false);
                            setEditingTemplate(null);
                        }
                    }}
                    template={editingTemplate || undefined}
                />
            )}
        </div>
    );
}
