'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { PageScaffold } from '@/components/PageScaffold';
import { SearchModal } from '@/components/SearchModal';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Filter, Edit3, Loader2, List, LayoutGrid, Plus } from 'lucide-react';
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
        <PageScaffold>
            <PageHeader title="Products">
                <div className="flex items-center gap-2">
                    <SearchModal
                        value={search}
                        onChange={setSearch}
                        placeholder="Search products..."
                    />

                    <div className="flex items-center gap-2 ml-auto">
                        <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(true)} className="h-9">
                            <Plus className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Create</span>
                        </Button>

                        <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing} className="h-9">
                            <RefreshCw className={`w-4 h-4 md:mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span className="hidden md:inline">Sync</span>
                        </Button>
                    </div>
                </div>
            </PageHeader>

            {/* List */}
            <div className="space-y-6 p-4 md:p-8">
                {/* View Options Toolbar (Scrolls away) */}
                <div className="flex items-center justify-end gap-2 text-muted-foreground">
                    <span className="text-xs font-medium uppercase tracking-wider opacity-70 mr-auto">
                        {filtered.length} Product{filtered.length !== 1 ? 's' : ''}
                    </span>
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
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="py-3 px-4 w-[60px]">Image</th>
                                    <th className="py-3 px-4">Title</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Price</th>
                                    <th className="py-3 px-4">Tags</th>
                                    <th className="py-3 px-4 text-right">Last Sync</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.map(product => (
                                    <tr
                                        key={product.id}
                                        className="group hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/products/${product.id}`)}
                                    >
                                        <td className="p-2 pl-4">
                                            <div className="w-10 h-10 relative rounded-md overflow-hidden bg-muted border">
                                                {product.images[0] && (
                                                    <Image src={product.images[0]} alt="Thumbnail" fill className="object-cover" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 px-4 font-medium">{product.title}</td>
                                        <td className="p-3 px-4">
                                            <Badge variant="outline" className="font-normal text-xs">{product.status}</Badge>
                                        </td>
                                        <td className="p-3 px-4 font-semibold">${product.price}</td>
                                        <td className="p-3 px-4 text-muted-foreground max-w-[200px] truncate">{product.tags}</td>
                                        <td className="p-3 px-4 text-right text-muted-foreground">
                                            {new Date(product.updatedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {filtered.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        No products found. Try syncing!
                    </div>
                )}
            </div>

            <CreateProductDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </PageScaffold>
    );
}
