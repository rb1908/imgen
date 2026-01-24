'use client';

import { useState, useEffect } from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image as ImageIcon, Upload, Loader2, Sparkles, FolderOpen } from 'lucide-react';
import { getUserAssets } from '@/app/actions/media';
import { getAllGenerations } from '@/app/actions/generations';

export function ImagesPanel() {
    const { dispatch } = useCanvasStore();
    const [activeTab, setActiveTab] = useState('upload');
    const [assets, setAssets] = useState<any[]>([]);
    const [generations, setGenerations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch data when switching tabs (lazy load)
    useEffect(() => {
        if (activeTab === 'assets' && assets.length === 0) {
            loadAssets();
        }
        if (activeTab === 'generated' && generations.length === 0) {
            loadGenerations();
        }
    }, [activeTab]);

    const loadAssets = async () => {
        setIsLoading(true);
        try {
            const data = await getUserAssets();
            setAssets(data);
        } finally {
            setIsLoading(false);
        }
    };

    const loadGenerations = async () => {
        setIsLoading(true);
        try {
            const data = await getAllGenerations(50);
            setGenerations(data);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddImage = (url: string) => {
        // CORs check might be needed, but Konva handles it via anonymous usually
        dispatch({
            type: 'ADD_IMAGE',
            url,
            x: 540,
            y: 540
        } as any);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            // Ideally upload to storage here too, but for now just local add
            handleAddImage(url);
            // Switch to assets maybe?
        }
    };

    return (
        <div className="h-full flex flex-col bg-neutral-900 text-white">
            <div className="p-4 pb-0">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-neutral-400" />
                    Images
                </h3>
            </div>

            <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-4">
                    <TabsList className="w-full bg-neutral-950/50 border border-neutral-800">
                        <TabsTrigger value="upload" className="flex-1 text-xs">Upload</TabsTrigger>
                        <TabsTrigger value="assets" className="flex-1 text-xs">Assets</TabsTrigger>
                        <TabsTrigger value="generated" className="flex-1 text-xs">AI</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden mt-4">
                    <TabsContent value="upload" className="h-full m-0 p-4">
                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-neutral-800 rounded-lg bg-neutral-950/30 text-neutral-500 gap-4">
                            <Upload className="w-8 h-8 opacity-50" />
                            <p className="text-sm">Upload Media</p>
                            <Button variant="outline" size="sm" onClick={() => document.getElementById('panel-image-upload')?.click()}>
                                Choose File
                            </Button>
                            <input
                                id="panel-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>
                        <p className="text-xs text-neutral-500 mt-4 text-center">
                            Supported formats: JPG, PNG, WEBP
                        </p>
                    </TabsContent>

                    <TabsContent value="assets" className="h-full m-0">
                        <ScrollArea className="h-full px-4 pb-4">
                            {isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-neutral-500" /></div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {assets.map((img, i) => (
                                        <button
                                            key={i}
                                            className="relative aspect-square rounded overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors bg-neutral-950 group"
                                            onClick={() => handleAddImage(img.url)}
                                        >
                                            <img src={img.url} className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                    {assets.length === 0 && (
                                        <div className="col-span-2 text-center py-8 text-neutral-500 text-sm">
                                            No assets found
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="generated" className="h-full m-0">
                        <ScrollArea className="h-full px-4 pb-4">
                            {isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-neutral-500" /></div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {generations.map((gen, i) => (
                                        <button
                                            key={i}
                                            className="relative aspect-square rounded overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors bg-neutral-950 group"
                                            onClick={() => handleAddImage(gen.imageUrl)}
                                        >
                                            <img src={gen.imageUrl} className="w-full h-full object-cover" loading="lazy" />
                                            {/* Badge or indicator if needed */}
                                        </button>
                                    ))}
                                    {generations.length === 0 && (
                                        <div className="col-span-2 text-center py-8 text-neutral-500 text-sm">
                                            No generations found
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </div>
            </Tabs>
        </div >
    );
}
