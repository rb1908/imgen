'use client';

import { ProductTemplate } from '@prisma/client';
import { Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { ProductTemplateDialog } from './ProductTemplateDialog';
import { deleteProductTemplate } from '@/app/actions/product_templates';
import { Pencil } from 'lucide-react';

interface ProductTemplatesListProps {
    templates: ProductTemplate[];
}

export function ProductTemplatesList({ templates }: ProductTemplatesListProps) {
    const [editingTemplate, setEditingTemplate] = useState<ProductTemplate | null>(null);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this template?")) {
            const res = await deleteProductTemplate(id);
            if (res.success) toast.success("Template deleted");
            else toast.error("Failed to delete template");
        }
    };

    const handleEdit = (template: ProductTemplate, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTemplate(template);
    };

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className="group relative border rounded-xl overflow-hidden bg-card hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setEditingTemplate(template)}
                    >
                        <div className="aspect-[4/3] bg-muted flex items-center justify-center text-muted-foreground">
                            <Package className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="p-3">
                            <h4 className="font-medium text-sm truncate" title={template.name}>{template.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">Product Template</p>
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button variant="secondary" size="icon" className="h-7 w-7" onClick={(e) => handleEdit(template, e)}>
                                <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-7 w-7" onClick={(e) => handleDelete(template.id, e)}>
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <ProductTemplateDialog
                open={!!editingTemplate}
                onOpenChange={(open) => !open && setEditingTemplate(null)}
                template={editingTemplate}
            />
        </>
    );
}
