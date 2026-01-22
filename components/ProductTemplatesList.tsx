'use client';

import { ProductTemplate } from '@prisma/client';
import { Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
// import { deleteProductTemplate } from '@/app/actions/product_templates'; // Assumption: needs to be created if not exists

interface ProductTemplatesListProps {
    templates: ProductTemplate[];
}

export function ProductTemplatesList({ templates }: ProductTemplatesListProps) {
    const handleDelete = async (id: string) => {
        if (confirm("Delete this template?")) {
            // Placeholder action until implemented
            toast.info("Deletion logic to be implemented");
            // const res = await deleteProductTemplate(id);
            // if (res.success) toast.success("Template deleted");
            // else toast.error("Failed");
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
                <div key={template.id} className="group relative border rounded-xl overflow-hidden bg-card hover:shadow-md transition-all">
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center text-muted-foreground">
                        <Package className="w-8 h-8 opacity-20" />
                    </div>
                    <div className="p-3">
                        <h4 className="font-medium text-sm truncate" title={template.name}>{template.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">Product Template</p>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDelete(template.id)}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
