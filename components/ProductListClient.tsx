'use client';

import { useState } from 'react';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Filter, Edit3, Loader2 } from 'lucide-react';
import { syncShopifyProducts } from '@/app/actions/shopify';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { ProductDetailForm } from './ProductDetailForm';


export function ProductListClient({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState(initialProducts);
    const [isSyncing, setIsSyncing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        const res = await syncShopifyProducts();
        if (res.success) {
            toast.success(`Synced ${res.count} products`);
            // Refresh would be ideal, but for now we might need to rely on revalidatePath
            // Or trigger a manual fetch if server action returns data. 
            // Since revalidatePath works on server components, simple router.refresh() works.
            window.location.reload();
        } else {
            toast.error("Sync failed");
        }
        setIsSyncing(false);
    };

    const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="p-4 flex gap-4 items-center bg-muted/20 border-b">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-8 bg-background"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync from Shopify
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(product => (
                        <div
                            key={product.id}
                            className="group border rounded-lg bg-card hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                            onClick={() => setSelectedProduct(product)}
                        >
                            <div className="aspect-[4/3] relative bg-muted">
                                {product.images[0] ? (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                                )}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Badge variant="secondary" className="bg-background/80 hover:bg-background">
                                        <Edit3 className="w-3 h-3 mr-1" /> Edit
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="font-medium line-clamp-1" title={product.title}>{product.title}</h3>
                                <div className="flex items-center justify-between mt-2 text-sm">
                                    <span className="font-semibold">${product.price}</span>
                                    <Badge variant="outline" className="text-xs font-normal">{product.status}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {product.description || "No description"}
                                </p>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                            No products found. Try syncing!
                        </div>
                    )}
                </div>
            </div>

            {/* Drawer for Editing */}
            <Drawer open={!!selectedProduct} onOpenChange={o => !o && setSelectedProduct(null)}>
                <DrawerContent className="h-[85vh]">
                    <div className="mx-auto w-full max-w-4xl h-full flex flex-col">
                        <DrawerHeader>
                            <DrawerTitle>Edit Product</DrawerTitle>
                            <DrawerDescription>Update details locally. (Push to Shopify coming soon)</DrawerDescription>
                        </DrawerHeader>
                        <div className="flex-1 overflow-y-auto p-6">
                            {selectedProduct && (
                                <ProductDetailForm product={selectedProduct} />
                            )}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
