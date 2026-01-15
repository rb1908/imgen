'use client';

import { useState, useEffect } from 'react';
import { getShopifyProducts, importFromShopify } from '@/app/actions/shopify';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ShopifyProduct {
    id: string;
    title: string;
    image: string | null;
    price: string;
}

export function ShopifyImportClient() {
    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setIsLoading(true);
        const result = await getShopifyProducts();
        if (result.success && result.products) {
            setProducts(result.products);
        } else {
            toast.error(result.error || "Failed to load products");
        }
        setIsLoading(false);
    };

    const handleToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleImport = async () => {
        if (selectedIds.length === 0) return;

        setIsImporting(true);
        const toImport = products.filter(p => selectedIds.includes(p.id));

        const result = await importFromShopify(toImport);

        if (result.success) {
            toast.success(`Imported ${result.count} products!`);
            router.push('/'); // Go to dashboard to see new projects
        } else {
            toast.error(result.error || "Import failed");
        }
        setIsImporting(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-muted-foreground mb-4">No products found or not connected.</p>
                <Button variant="outline" onClick={() => router.push('/settings')}>Check Connection</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                <div>
                    <h2 className="text-lg font-semibold">{products.length} Products Found</h2>
                    <p className="text-sm text-muted-foreground">{selectedIds.length} selected</p>
                </div>
                <Button
                    onClick={handleImport}
                    disabled={selectedIds.length === 0 || isImporting}
                    className="bg-primary text-primary-foreground"
                >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Import Selected
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map(product => (
                    <div
                        key={product.id}
                        className={`group relative aspect-[3/4] border rounded-xl overflow-hidden cursor-pointer transition-all ${selectedIds.includes(product.id) ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                        onClick={() => handleToggle(product.id)}
                    >
                        {product.image ? (
                            <Image
                                src={product.image}
                                alt={product.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-xs">No Image</div>
                        )}

                        <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                                checked={selectedIds.includes(product.id)}
                                onCheckedChange={() => handleToggle(product.id)}
                                className="bg-white/90 border-black/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                        </div>

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                            <p className="text-white text-sm font-medium line-clamp-1">{product.title}</p>
                            <p className="text-white/70 text-xs">${product.price}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
