'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2, Type, Image as ImageIcon, LayoutTemplate } from 'lucide-react';

interface SocialControlsProps {
    format: 'square' | 'story' | 'og';
    setFormat: (f: 'square' | 'story' | 'og') => void;
    onAddText: () => void;
    onSelectAsset: () => void;
}

export function SocialControls({ format, setFormat, onAddText, onSelectAsset }: SocialControlsProps) {
    return (
        <div className="w-80 border-l bg-card h-full flex flex-col">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Design Controls</h3>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Format Selector */}
                    <div className="space-y-3">
                        <Label>Format</Label>
                        <Tabs value={format} onValueChange={(v) => setFormat(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="square">Square</TabsTrigger>
                                <TabsTrigger value="story">Story</TabsTrigger>
                                <TabsTrigger value="og">Cover</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <Label>Layers</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={onSelectAsset} className="justify-start gap-2 h-auto py-3">
                                <ImageIcon className="w-4 h-4" />
                                <div className="text-left">
                                    <span className="block text-xs font-semibold">Image</span>
                                    <span className="block text-[10px] text-muted-foreground">Product/Gen</span>
                                </div>
                            </Button>
                            <Button variant="outline" onClick={onAddText} className="justify-start gap-2 h-auto py-3">
                                <Type className="w-4 h-4" />
                                <div className="text-left">
                                    <span className="block text-xs font-semibold">Text</span>
                                    <span className="block text-[10px] text-muted-foreground">Add caption</span>
                                </div>
                            </Button>
                        </div>
                    </div>

                    {/* Templates Shortcut */}
                    <div className="space-y-2">
                        <Label>Quick Templates</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="aspect-[9/16] bg-muted rounded-md border cursor-pointer hover:border-primary transition-colors" />
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
