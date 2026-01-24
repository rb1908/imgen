'use client';

import { useState, useEffect } from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image as ImageIcon, Upload, Loader2, Sparkles, FolderOpen, Search, ArrowRight } from 'lucide-react';
import { getUserAssets } from '@/app/actions/media';
import { getAllGenerations } from '@/app/actions/generations';
import { Input } from '@/components/ui/input';

export function ImagesPanel() {
    const { dispatch } = useCanvasStore();
    const [assets, setAssets] = useState<any[]>([]);
    const [generations, setGenerations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch data on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [assetsData, generationsData] = await Promise.all([
                    getUserAssets(20), // Fetch fewer for preview sections
                    getAllGenerations(20)
                ]);
                setAssets(assetsData);
                setGenerations(generationsData);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleAddImage = (url: string) => {
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
            handleAddImage(url);
        }
    };

    return (
        <div className="h-full flex flex-col bg-neutral-900 text-white">
            {/* Header with Title */}
            <div className="p-4 pb-2">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-neutral-400" />
                    Images
                </h3>
            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-4 flex gap-2">
                <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none"
                    onClick={() => { /* TODO: Open AI Generator */ }}
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    onClick={() => document.getElementById('panel-image-upload')?.click()}
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                </Button>
                <input
                    id="panel-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                />
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="flex flex-col gap-6 px-2 pb-8">

                    {/* My Assets Section */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-neutral-400 uppercase">My Assets</h4>
                            <button className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors">
                                View all <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="h-20 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-neutral-500" /></div>
                        ) : assets.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {assets.slice(0, 6).map((img, i) => (
                                    <button
                                        key={i}
                                        className="relative aspect-square rounded-md overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors bg-neutral-950 group"
                                        onClick={() => handleAddImage(img.url)}
                                    >
                                        <img src={img.url} className="w-full h-full object-cover" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-neutral-500 py-4 text-center border border-dashed border-neutral-800 rounded">
                                No uploads yet
                            </div>
                        )}
                    </div>

                    {/* Generated Section */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-neutral-400 uppercase">Generated</h4>
                            <button className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors">
                                View all <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="h-20 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-neutral-500" /></div>
                        ) : generations.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {generations.slice(0, 4).map((gen, i) => (
                                    <button
                                        key={i}
                                        className="relative aspect-square rounded-md overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors bg-neutral-950 group"
                                        onClick={() => handleAddImage(gen.imageUrl)}
                                    >
                                        <img src={gen.imageUrl} className="w-full h-full object-cover" loading="lazy" />
                                        <div className="absolute top-1 right-1 bg-blue-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Sparkles className="w-3 h-3 text-white" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-neutral-500 py-4 text-center border border-dashed border-neutral-800 rounded">
                                No AI generations yet
                            </div>
                        )}
                    </div>

                    {/* Stock Images Section (Placeholder) */}
                    <div className="flex flex-col gap-2 opacity-50 pointer-events-none grayscale">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-neutral-400 uppercase">Stock Images (Coming Soon)</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="aspect-video bg-neutral-800 rounded animate-pulse" />
                            <div className="aspect-video bg-neutral-800 rounded animate-pulse" />
                        </div>
                    </div>

                </div>
            </ScrollArea>
        </div >
    );
}
