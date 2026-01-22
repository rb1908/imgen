'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllGenerations } from '@/app/actions/generations';
import { getLocalProducts } from '@/app/actions/shopify';
import { Loader2, Search, Image as ImageIcon, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AssetPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (url: string) => void;
}

export function AssetPickerDialog({ open, onOpenChange, onSelect }: AssetPickerDialogProps) {
    const [tab, setTab] = useState<'generations' | 'products'>('generations');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [generations, setGenerations] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            fetchAssets();
        }
    }, [open, tab]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            if (tab === 'generations') {
                const res = await getAllGenerations(50, search);
                setGenerations(res);
            } else {
                const res = await getLocalProducts(); // TODO: Add search support to getLocalProducts or filter client-side
                // Client-side filtering for products as getLocalProducts doesn't accept query yet
                const filtered = search
                    ? res.filter((p: any) => p.title.toLowerCase().includes(search.toLowerCase()))
                    : res;
                setProducts(filtered);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load assets");
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (open) fetchAssets();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSelect = (url: string) => {
        if (!url) return;
        onSelect(url);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b">
                    <DialogTitle>Select Asset</DialogTitle>
                    <div className="flex items-center gap-4 pt-4">
                        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-[300px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="generations" className="gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Generations
                                </TabsTrigger>
                                <TabsTrigger value="products" className="gap-2">
                                    <ShoppingBag className="w-4 h-4" />
                                    Products
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="flex-1 relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                            {tab === 'generations' ? (
                                generations.map((gen) => (
                                    <div
                                        key={gen.id}
                                        className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 ring-primary transition-all"
                                        onClick={() => handleSelect(gen.imageUrl)}
                                    >
                                        <img src={gen.imageUrl} alt={gen.promptUsed} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                            <p className="text-[10px] text-white truncate w-full">{gen.promptUsed}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                products.map((prod) => (
                                    <div
                                        key={prod.id}
                                        className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 ring-primary transition-all"
                                        onClick={() => handleSelect(prod.images[0] || '')}
                                    >
                                        {prod.images[0] ? (
                                            <img src={prod.images[0]} alt={prod.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <ShoppingBag className="w-8 h-8 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                                            <p className="text-xs font-medium text-white truncate">{prod.title}</p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {!loading && ((tab === 'generations' && generations.length === 0) || (tab === 'products' && products.length === 0)) && (
                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                    No assets found.
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

            </DialogContent>
        </Dialog>
    );
}
