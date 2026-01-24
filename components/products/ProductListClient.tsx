'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { PageScaffold } from '@/components/PageScaffold';
import { SearchModal } from '@/components/SearchModal';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Filter, Edit3, Loader2, List, LayoutGrid, Plus, Image as ImageIcon, X, MoreVertical, LayoutTemplate, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { saveAsTemplate } from '@/app/actions/product_templates';
import { syncShopifyProducts, deleteProducts } from '@/app/actions/shopify';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProductDetailForm } from './ProductDetailForm';
import { CreateProductDialog } from './CreateProductDialog';
import { UnsyncedChangesDialog } from './UnsyncedChangesDialog';
import { ArrowUpCircle } from 'lucide-react';


export function ProductListClient({ initialProducts }: { initialProducts: Product[] }) {
    // React Query for Data Fetching
    const { data: products = [], isLoading, isRefetching } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { getLocalProducts } = await import('@/app/actions/shopify');
            return getLocalProducts();
        },
        initialData: initialProducts,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const queryClient = useQueryClient();

    // Mutations
    const syncMutation = useMutation({
        mutationFn: async () => {
            const { syncShopifyProducts } = await import('@/app/actions/shopify');
            return syncShopifyProducts();
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success(`Synced ${data.count} products`);
                queryClient.invalidateQueries({ queryKey: ['products'] });
                setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            } else {
                toast.error("Sync failed");
            }
        },
        onError: () => toast.error("Sync error occurred")
    });

    const deleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            const { deleteProducts } = await import('@/app/actions/shopify');
            return deleteProducts(ids);
        },
        onSuccess: (data, variables) => {
            if (data.success) {
                toast.success("Products deleted");
                queryClient.invalidateQueries({ queryKey: ['products'] });
                setSelectedIds([]);
            } else {
                toast.error("Deletion failed");
            }
        },
        onError: () => toast.error("Delete error occurred")
    });

    // Local UI State
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const router = useRouter();
    const [lastSynced, setLastSynced] = useState<string | null>(null);

    // Template State
    const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    // Deletion State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [isDeleting, setIsDeleting] = useState(false);

    const openSaveTemplate = (e: React.MouseEvent, productId: string) => {
        e.stopPropagation(); // Prevent card click
        setSelectedProductId(productId);
        setIsSaveTemplateOpen(true);
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim() || !selectedProductId) return;
        setIsSavingTemplate(true);
        try {
            const { saveAsTemplate } = await import('@/app/actions/product_templates');
            const res = await saveAsTemplate(selectedProductId, templateName);
            if (res.success) {
                toast.success(`Template "${templateName}" saved!`);
                setIsSaveTemplateOpen(false);
                setTemplateName("");
                setSelectedProductId(null);
            } else {
                toast.error("Failed to save template");
            }
        } catch (e) {
            toast.error("Error saving template");
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const isSyncing = syncMutation.isPending;
    const isDeleting = deleteMutation.isPending;

    const handleSync = () => syncMutation.mutate();

    const handleDelete = async (ids: string[]) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} product(s)? This only removes them from the app, not Shopify.`)) return;
        deleteMutation.mutate(ids);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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
                        <Button variant="default" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
                            <Plus className="w-4 h-4" />
                            <span>New</span>
                        </Button>
                    </div>
                </div>
            </PageHeader>

            <div className="space-y-6 p-4 md:p-8">
                <div className="flex items-center justify-end gap-2 text-muted-foreground">
                    <div className="mr-auto flex items-center gap-2">
                        {selectedIds.length > 0 ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(selectedIds)}
                                    disabled={isDeleting}
                                    className="h-8 shadow-sm"
                                >
                                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Trash2 className="w-3 h-3 mr-2" />}
                                    Delete {selectedIds.length}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(p => p.id))}
                                    className="h-8"
                                >
                                    {selectedIds.length === filtered.length ? "Deselect All" : "Select All"}
                                </Button>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`p-2 rounded-md transition-all hover:bg-accent text-muted-foreground hover:text-foreground ${isSyncing ? 'animate-pulse' : ''}`}
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={() => setIsReviewOpen(true)}
                        className="p-2 rounded-md transition-all hover:bg-accent text-orange-600 hover:text-orange-700 bg-orange-500/10 hover:bg-orange-500/20 mr-1"
                        title="Review Local Changes"
                    >
                        <ArrowUpCircle className="w-4 h-4" />
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
                                className={`group border rounded-lg bg-card hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col ${selectedIds.includes(product.id) ? 'ring-2 ring-primary border-primary' : ''}`}
                                onClick={() => selectedIds.length > 0 ? toggleSelection(product.id) : router.push(`/products/${product.id}`)}
                            >
                                <div className="aspect-[4/3] relative bg-muted">
                                    {/* Selection Overlay */}
                                    <div className={`absolute inset-0 bg-black/5 z-10 transition-opacity ${selectedIds.includes(product.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <div className="absolute top-2 left-2">
                                            <div
                                                className={`w-5 h-5 rounded border shadow-sm flex items-center justify-center cursor-pointer transition-all ${selectedIds.includes(product.id) ? 'bg-primary border-primary text-primary-foreground' : 'bg-white border-gray-300 hover:border-primary'}`}
                                                onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }}
                                            >
                                                {selectedIds.includes(product.id) && <div className="w-2.5 h-2.5 bg-current rounded-sm" />}
                                            </div>
                                        </div>
                                    </div>

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
                                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="icon" className="h-7 w-7 bg-white/90 hover:bg-white rounded-full shadow-sm text-gray-700" onClick={(e) => e.stopPropagation()}>
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => openSaveTemplate(e, product.id)}>
                                                    <LayoutTemplate className="w-4 h-4 mr-2" />
                                                    Save as Template
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete([product.id]); }} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                                onClick={() => selectedIds.length > 0 ? toggleSelection(product.id) : router.push(`/products/${product.id}`)}
                                className={`group flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all cursor-pointer shadow-sm hover:border-primary/20 ${selectedIds.includes(product.id) ? 'bg-muted/50 border-primary/50' : ''}`}
                            >
                                {/* Checkbox */}
                                <div className="pl-1 pr-1" onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedIds.includes(product.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                                        {selectedIds.includes(product.id) && <div className="w-2 h-2 bg-current rounded-sm" />}
                                    </div>
                                </div>
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

                                {/* Actions */}
                                <div className="shrink-0 flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => openSaveTemplate(e, product.id)}>
                                                <LayoutTemplate className="w-4 h-4 mr-2" />
                                                Save as Template
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete([product.id]); }} className="text-destructive focus:text-destructive">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
            <UnsyncedChangesDialog open={isReviewOpen} onOpenChange={setIsReviewOpen} />

            {/* Save Template Dialog */}
            <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Save as Template</DialogTitle>
                        <DialogDescription>
                            Create a reusable template from this product.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="t-name">Template Name</Label>
                            <Input id="t-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Best Seller Setup" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveTemplate} disabled={!templateName.trim() || isSavingTemplate}>
                            {isSavingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageScaffold >
    );
}
