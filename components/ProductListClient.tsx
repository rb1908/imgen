'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { PageScaffold } from '@/components/PageScaffold';
import { SearchModal } from '@/components/SearchModal';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Filter, Edit3, Loader2, List, LayoutGrid, Plus, Image as ImageIcon, X } from 'lucide-react';
import { syncShopifyProducts } from '@/app/actions/shopify';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProductDetailForm } from './ProductDetailForm';
import { CreateProductDialog } from './CreateProductDialog';


export function ProductListClient({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState(initialProducts);
    const [isSyncing, setIsSyncing] = useState(false);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const router = useRouter();

    const [lastSynced, setLastSynced] = useState<string | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        const res = await syncShopifyProducts();
        if (res.success) {
            toast.success(`Synced ${res.count} products`);
            setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            window.location.reload();
        } else {
            toast.error("Sync failed");
        }
        setIsSyncing(false);
    };

    const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <PageScaffold>
            <PageHeader title="Products">
                <div className="flex items-center gap-2">
                    <SearchModal
                        value={search}
                        onChange={setSearch}
                        placeholder="Search products..."
                    />

                    <div className="flex items-center gap-2 ml-auto">
                        <Button variant="default" size="sm" onClick={() => setIsCreateOpen(true)} className="h-9 shadow-sm">
                            <Plus className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Create Product</span>
                        </Button>
                    </div>
                </div>
            </PageHeader>

                <div className="flex items-center justify-end gap-2 text-muted-foreground">
                    <div className="mr-auto flex items-center gap-2">
                        {search ? (
                            <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md animate-in fade-in slide-in-from-left-2">
                                <span className="text-xs font-semibold text-foreground">
                                    {filtered.length} for "{search}"
                                </span>
                                <button
                                    onClick={() => setSearch('')}
                                    className="p-0.5 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                    title="Clear search"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                                {filtered.length} Product{filtered.length !== 1 ? 's' : ''}
                            </span>
                        )}

                        {lastSynced && !search && (
                            <span className="hidden sm:inline-block text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full border border-green-500/20 animate-in fade-in">
                                Synced {lastSynced}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`p-2 rounded-md transition-all hover:bg-accent text-muted-foreground hover:text-foreground ${isSyncing ? 'animate-pulse' : ''}`}
                        title="Sync with Shopify"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>

                    <div className="w-[1px] h-4 bg-border mx-1" />

                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all hover:bg-accent ${viewMode === 'grid' ? 'text-foreground bg-accent/50' : 'text-muted-foreground'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all hover:bg-accent ${viewMode === 'list' ? 'text-foreground bg-accent/50' : 'text-muted-foreground'}`}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                        {filtered.map(product => (
                            <div
                                key={product.id}
                                className="group border rounded-lg bg-card hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                                onClick={() => router.push(`/products/${product.id}`)}
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
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 pb-24 md:pb-0">
                        {filtered.map(product => (
                            <div
                                key={product.id}
                                onClick={() => router.push(`/products/${product.id}`)}
                                className="group flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all cursor-pointer shadow-sm hover:border-primary/20"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted border">
                                    {product.images[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt="Thumbnail"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-secondary">
                                            <ImageIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                    <h3 className="font-semibold text-sm truncate pr-2">{product.title}</h3>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] font-normal rounded-sm">
                                            {product.status}
                                        </Badge>
                                        <span className="w-0.5 h-0.5 rounded-full bg-zinc-300" />
                                        <span className="font-medium text-foreground">${product.price}</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-zinc-300" />
                                        <span className="truncate max-w-[120px]">{product.tags || "No tags"}</span>
                                    </div>
                                </div>

                                {/* Date / Arrow */}
                                <div className="text-[10px] text-muted-foreground shrink-0 hidden md:block">
                                    {new Date(product.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filtered.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        No products found. Try syncing!
                    </div>
                )}
            </div>

            <CreateProductDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </PageScaffold >
    );
}
