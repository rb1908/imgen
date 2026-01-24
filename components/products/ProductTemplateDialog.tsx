'use client';

import { useMediaQuery } from '@/hooks/use-media-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { ProductTemplate } from '@prisma/client';
import { ProductTemplateForm } from './ProductTemplateForm';

interface ProductTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: ProductTemplate | null;
}

export function ProductTemplateDialog({ open, onOpenChange, template }: ProductTemplateDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!template) return null;

    const Content = (
        <ProductTemplateForm
            template={template}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
        />
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Product Template</DialogTitle>
                        <DialogDescription>
                            Edit the default values for this product template.
                        </DialogDescription>
                    </DialogHeader>
                    {Content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>Edit Product Template</DrawerTitle>
                    <DrawerDescription>
                        Edit the default values for this product template.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-8">
                    {Content}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
