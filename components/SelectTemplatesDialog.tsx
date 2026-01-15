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

interface SelectTemplatesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: Template[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onEdit: (template: Template) => void;
    onDelete: (id: string) => void;
    mode: 'template' | 'custom';
    onModeChange: (mode: 'template' | 'custom') => void;
    customPrompt: string;
    onCustomPromptChange: (prompt: string) => void;
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
    mode,
    onModeChange,
    customPrompt,
    onCustomPromptChange
}: SelectTemplatesDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const isAllSelected = templates.length > 0 && selectedIds.length === templates.length;

    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleEnhance = async () => {
        if (!customPrompt || customPrompt.length < 3) {
            toast.error("Enter a basic prompt first");
            return;
        }

        setIsEnhancing(true);
        try {
            const { enhancedPrompt, error } = await enhancePrompt(customPrompt);
            if (error) {
                toast.error(error);
            } else {
                onCustomPromptChange(enhancedPrompt);
                toast.success("Prompt enhanced!");
            }
        } catch (e) {
            toast.error("Failed to enhance prompt");
        } finally {
            setIsEnhancing(false);
        }
    };

    const Content = (
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as 'template' | 'custom')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="template">Templates</TabsTrigger>
                <TabsTrigger value="custom">Custom Prompt</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Custom Prompt</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-primary gap-1.5 hover:bg-primary/10 hover:text-primary pr-2"
                            onClick={handleEnhance}
                            disabled={isEnhancing || !customPrompt}
                            title="Enhance with AI"
                        >
                            {isEnhancing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Wand2 className="w-3 h-3" />
                            )}
                            {isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}
                        </Button>
                    </div>
                    <Textarea
                        placeholder="Describe the variation you want to generate (e.g., 'Modern rustic living room')..."
                        className="min-h-[150px] resize-none"
                        value={customPrompt}
                        onChange={(e) => onCustomPromptChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Your prompt will be sent to the creative agent along with the reference image.
                    </p>
                </div>
            </TabsContent>
        </Tabs>
    );

    const title = mode === 'template' ? 'Select Templates' : 'Custom Prompt';
    const description = mode === 'template' ? 'Choose styles to generate variations for.' : 'Enter a custom prompt for your generation.';

    if (isDesktop) {
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
