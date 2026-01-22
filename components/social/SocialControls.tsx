'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2, Type, Image as ImageIcon, Sparkles, Loader2, Wand2, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { generateSocialMetadata } from '@/app/actions/social_metadata';
import { generateSocialImage } from '@/app/actions/image_generation';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface SocialControlsProps {
    format: 'square' | 'story' | 'og';
    setFormat: (f: 'square' | 'story' | 'og') => void;
    onAddText: () => void;
    onSelectAsset: () => void;
    currentImage?: string;
    onImageGenerated?: (url: string) => void;
}

export function SocialControls({ format, setFormat, onAddText, onSelectAsset, currentImage, onImageGenerated }: SocialControlsProps) {
    // Metadata State
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
    const [metadata, setMetadata] = useState({ title: '', caption: '', hashtags: '' });
    const [tone, setTone] = useState<'fun' | 'professional' | 'urgent'>('fun');

    // Image Gen State
    const [prompt, setPrompt] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Handlers
    const handleGenerateMetadata = async () => {
        if (!currentImage) return toast.error("Please select an image first");
        setIsGeneratingMeta(true);
        try {
            const res = await generateSocialMetadata(currentImage, tone);
            if (res.success) {
                setMetadata(res.data);
                toast.success("Metadata generated!");
            } else {
                toast.error(res.error || "Generation failed");
            }
        } catch (e) { toast.error("Error generating metadata"); }
        finally { setIsGeneratingMeta(false); }
    };

    const handleGenerateImage = async () => {
        if (!prompt) return toast.error("Please enter a prompt");
        setIsGeneratingImage(true);
        try {
            // Pass currentImage if they want to edit, otherwise undefined for new
            const res = await generateSocialImage(prompt, currentImage);
            if (res.success && res.imageUrl) {
                toast.success("Image generated!");
                onImageGenerated?.(res.imageUrl);
            } else {
                toast.error(res.error || "Image generation failed");
            }
        } catch (e) { toast.error("Error generating image"); }
        finally { setIsGeneratingImage(false); }
    };

    return (
        <div className="w-96 border-l bg-background h-full flex flex-col shadow-sm z-10">
            <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Social Studio</h3>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="w-4 h-4" /></Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-5 space-y-8">

                    {/* SECTION 1: AI STUDIO */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <h4 className="font-medium text-sm">AI Producer</h4>
                        </div>

                        <div className="p-4 bg-muted/20 rounded-xl border space-y-3">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold text-muted-foreground">PROMPT</Label>
                                    {currentImage && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Editing Active</span>
                                    )}
                                </div>
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={currentImage ? "Describe changes (e.g. 'add snow')..." : "Describe a new image..."}
                                    className="min-h-[80px] bg-background resize-none text-sm border-transparent focus:border-input shadow-sm"
                                />
                            </div>
                            <Button
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage}
                                className="w-full bg-[#1F1F1F] hover:bg-black text-white gap-2 h-9"
                            >
                                {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                {currentImage ? "Remix Image" : "Generate Image"}
                            </Button>
                        </div>
                    </section>

                    <Separator />

                    {/* SECTION 2: CANVAS */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Canvas & Format</h4>
                        </div>

                        <div className="bg-muted/40 p-1 rounded-lg flex items-center gap-1">
                            {(['square', 'story', 'og'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f)}
                                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${format === f
                                            ? 'bg-background shadow text-foreground'
                                            : 'text-muted-foreground hover:bg-background/50'
                                        }`}
                                >
                                    {f === 'og' ? 'Cover' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" onClick={onSelectAsset} className="h-20 flex flex-col gap-2 items-center justify-center border-dashed hover:border-solid hover:border-primary/50 hover:bg-accent/50">
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                <span className="text-xs font-medium">Replace Image</span>
                            </Button>
                            <Button variant="outline" onClick={onAddText} className="h-20 flex flex-col gap-2 items-center justify-center border-dashed hover:border-solid hover:border-primary/50 hover:bg-accent/50">
                                <Type className="w-5 h-5 text-muted-foreground" />
                                <span className="text-xs font-medium">Add Text</span>
                            </Button>
                        </div>
                    </section>

                    <Separator />

                    {/* SECTION 3: METADATA */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Post Details</h4>
                            <div className="flex items-center gap-2">
                                <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                                    <SelectTrigger className="h-7 w-[100px] text-[10px] bg-transparent border-none shadow-none text-muted-foreground focus:ring-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fun">Fun 🤪</SelectItem>
                                        <SelectItem value="professional">Pro 💼</SelectItem>
                                        <SelectItem value="urgent">Urgent 🚨</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                    onClick={handleGenerateMetadata}
                                    disabled={isGeneratingMeta}
                                >
                                    {isGeneratingMeta ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Title (Hook)</Label>
                                <Input
                                    value={metadata.title}
                                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                    placeholder="e.g. Summer Sale is Here!"
                                    className="bg-muted/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Caption</Label>
                                <Textarea
                                    value={metadata.caption}
                                    onChange={(e) => setMetadata({ ...metadata, caption: e.target.value })}
                                    placeholder="Write a caption..."
                                    className="bg-muted/20 min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Hashtags</Label>
                                <Textarea
                                    value={metadata.hashtags}
                                    onChange={(e) => setMetadata({ ...metadata, hashtags: e.target.value })}
                                    placeholder="#tags..."
                                    className="bg-muted/20 min-h-[60px] font-mono text-[10px]"
                                />
                            </div>
                        </div>
                    </section>

                </div>
            </ScrollArea>
        </div>
    );
}
