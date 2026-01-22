'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2, Type, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { generateSocialMetadata } from '@/app/actions/social_metadata';
import { toast } from 'sonner';

interface SocialControlsProps {
    format: 'square' | 'story' | 'og';
    setFormat: (f: 'square' | 'story' | 'og') => void;
    onAddText: () => void;
    onSelectAsset: () => void;
    currentImage?: string;
}

export function SocialControls({ format, setFormat, onAddText, onSelectAsset, currentImage }: SocialControlsProps) {
    const [activeTab, setActiveTab] = useState('design');
    const [isGenerating, setIsGenerating] = useState(false);
    const [metadata, setMetadata] = useState({ title: '', caption: '', hashtags: '' });
    const [tone, setTone] = useState<'fun' | 'professional' | 'urgent'>('fun');

    const handleGenerate = async () => {
        if (!currentImage) {
            toast.error("Please select an image first");
            return;
        }
        setIsGenerating(true);
        try {
            const res = await generateSocialMetadata(currentImage, tone);
            if (res.success) {
                setMetadata(res.data);
                toast.success("Metadata generated!");
            } else {
                toast.error("Generation failed");
            }
        } catch (e) {
            toast.error("Error generating metadata");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-80 border-l bg-card h-full flex flex-col">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Post Editor</h3>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-4 pt-2">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="design">Design</TabsTrigger>
                        <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1">
                    <TabsContent value="design" className="p-4 space-y-6 mt-0">
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
                    </TabsContent>

                    <TabsContent value="metadata" className="p-4 space-y-6 mt-0">
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg space-y-3 border">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">AI Assistant</Label>
                                    <Sparkles className="w-3 h-3 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tone</Label>
                                    <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fun">Fun & Emoji-filled</SelectItem>
                                            <SelectItem value="professional">Professional</SelectItem>
                                            <SelectItem value="urgent">Urgent / Sale</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 border-0"
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 fill-white" />}
                                    Generate Metadata
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Title (Hook)</Label>
                                <Input
                                    placeholder="Thumb-stopping hook..."
                                    value={metadata.title}
                                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Caption</Label>
                                <Textarea
                                    placeholder="Write your caption here..."
                                    className="min-h-[150px]"
                                    value={metadata.caption}
                                    onChange={(e) => setMetadata({ ...metadata, caption: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Hashtags</Label>
                                <Textarea
                                    placeholder="#marketing #social..."
                                    className="min-h-[80px] font-mono text-xs"
                                    value={metadata.hashtags}
                                    onChange={(e) => setMetadata({ ...metadata, hashtags: e.target.value })}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
