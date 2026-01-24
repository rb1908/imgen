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
import { Template } from '@prisma/client';
import { TemplateForm } from './TemplateForm';

interface TemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    prompt?: string;
    thumbnailUrl?: string;
    template?: Template; // If provided, we are in Edit mode
}

export function TemplateDialog({ open, onOpenChange, prompt, thumbnailUrl, template }: TemplateDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const isEdit = !!template;

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Edit Template' : 'Save as Template'}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? 'Modify your existing template details.' : 'Save this prompt to your library for future use.'}
                        </DialogDescription>
                    </DialogHeader>
                    <TemplateForm
                        template={template}
                        prompt={prompt}
                        thumbnailUrl={thumbnailUrl}
                        onSuccess={() => onOpenChange(false)}
                        onCancel={() => onOpenChange(false)}
                    />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>{isEdit ? 'Edit Template' : 'Save as Template'}</DrawerTitle>
                    <DrawerDescription>
                        {isEdit ? 'Modify your existing template details.' : 'Save this prompt to your library for future use.'}
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-8">
                    <TemplateForm
                        template={template}
                        prompt={prompt}
                        thumbnailUrl={thumbnailUrl}
                        onSuccess={() => onOpenChange(false)}
                        onCancel={() => onOpenChange(false)}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
