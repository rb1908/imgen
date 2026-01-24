"use client";

import { useState } from 'react';
import { Template } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TemplateItem } from './TemplateItem';
import { TemplateDialog } from './TemplateDialog';
import { deleteTemplate } from '@/app/actions/templates';
import { toast } from 'sonner';

interface TemplateManagerProps {
    templates: Template[];
}

export function TemplateManager({ templates }: TemplateManagerProps) {
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleDelete = async (id: string) => {
        if (confirm("Delete this template?")) {
            await deleteTemplate(id);
            toast.success("Template deleted");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                <Button onClick={() => setIsCreating(true)} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Look
                </Button>
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
        </div>
    );
}
