'use client';

import { useMediaQuery } from '@/hooks/use-media-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
    DrawerTrigger
} from "@/components/ui/drawer"
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Template } from '@prisma/client';
import { TemplateItem } from './TemplateItem';
import { Palette } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { enhancePrompt } from '@/app/actions/enhance';
import { Loader2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface SelectTemplatesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: Template[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onEdit: (template: Template) => void;
    onDelete: (id: string) => void;
    forceDrawer?: boolean;
}

export function SelectTemplatesDialog({
    open,
    onOpenChange,
    templates,
    selectedIds,
    onToggle,
    onSelectAll,
    onEdit,
    onDelete,
    forceDrawer = true
}: SelectTemplatesDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const isAllSelected = templates.length > 0 && selectedIds.length === templates.length;

    const Content = (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">
                    {selectedIds.length} selected
                </span>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all-dialog"
                        checked={isAllSelected}
                        onCheckedChange={onSelectAll}
                    />
                    <Label htmlFor="select-all-dialog" className="text-xs font-medium cursor-pointer">
                        Select All
                    </Label>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto px-1">
                {templates.map(t => (
                    <TemplateItem
                        key={t.id}
                        template={t}
                        isSelected={selectedIds.includes(t.id)}
                        onToggle={() => onToggle(t.id)}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        variant="grid"
                    />
                ))}
            </div>
        </div>
    );

    const title = 'Select Templates';
    const description = 'Choose styles to generate variations for.';

    if (isDesktop && !forceDrawer) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    {Content}
                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>{description}</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4">
                        {Content}
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button>Done</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
