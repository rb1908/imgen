"use client";

import { useEffect, useState, useMemo } from 'react';
import { getLocalProducts } from '@/app/actions/shopify';
import { setProjectDefaultProduct } from '@/app/actions/projects';
import { createProduct } from '@/app/actions/product_actions';
import { ShoppingBag, Check, ChevronsUpDown, Plus, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product, ProductVariant } from '@prisma/client';
import Image from 'next/image';
import { toast } from 'sonner';

interface ProductWithRelations extends Product {
    variants: ProductVariant[];
}

interface ProductSelectorProps {
    projectId: string;
    initialDefaultProductId: string | null;
}

export function ProductSelector({ projectId, initialDefaultProductId }: ProductSelectorProps) {
    const [products, setProducts] = useState<ProductWithRelations[]>([]);
    const [selectedId, setSelectedId] = useState<string | undefined>(initialDefaultProductId || undefined);
    const [loading, setLoading] = useState(true);

    // Combobox State
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        getLocalProducts().then(data => {
            setProducts(data as ProductWithRelations[]);
            setLoading(false);
        });
    }, []);

    const handleSelect = async (id: string | null) => {
        setSelectedId(id || undefined);
        setOpen(false);
        const res = await setProjectDefaultProduct(projectId, id);
        if (res.success) {
            toast.success(id ? "Linked to product" : "Unlinked");
        } else {
            toast.error("Failed to link");
            // Revert state if failed (optional, but good UX)
        }
    };

    const handleCreate = async () => {
        if (!searchTerm.trim()) return;

        setIsCreating(true);
        try {
            // Create product with just the title
            const res = await createProduct({ title: searchTerm.trim() });

            if (res.success && res.product) {
                // Add to local list optimistically. Note: New product has no variants yet.
                const newProduct = { ...res.product, variants: [] } as ProductWithRelations;
                setProducts(prev => [newProduct, ...prev]);

                // Select it
                await handleSelect(newProduct.id);
                toast.success("Product created & linked");
            } else {
                toast.error("Failed to create product");
            }
        } catch (e) {
            toast.error("Error creating product");
        } finally {
            setIsCreating(false);
        }
    };

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.variants.some(v => v.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [products, searchTerm]);

    const selectedProduct = products.find(p => p.id === selectedId);

    if (loading) return null;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-[280px] justify-between text-xs h-9 bg-background border-dashed border-border hover:bg-accent hover:border-solid transition-all pl-2"
                >
                    <div className="flex items-center min-w-0">
                        <ShoppingBag className="mr-2 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                            {selectedProduct ? selectedProduct.title : "Link to Product..."}
                        </span>
                        {selectedProduct && selectedProduct.variants[0]?.sku && (
                            <span className="ml-2 text-[10px] text-muted-foreground truncate font-mono bg-muted px-1 rounded">
                                {selectedProduct.variants[0].sku}
                            </span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[320px] p-0" align="start">
                <div className="flex items-center border-b px-3 pb-2 pt-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-6 w-full rounded-md bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        placeholder="Search by title or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                // Create if search term exists and we aren't creating
                                if (searchTerm.trim() && !isCreating) {
                                    handleCreate();
                                }
                            }
                        }}
                    />
                </div>

                <div className="max-h-[300px] overflow-y-auto p-1">
                    <DropdownMenuItem onClick={() => handleSelect(null)}>
                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center", !selectedId ? "opacity-100" : "opacity-0")}>
                            <Check className="h-4 w-4" />
                        </div>
                        <span>No Link</span>
                    </DropdownMenuItem>

                    {filteredProducts.map((product) => (
                        <DropdownMenuItem key={product.id} onClick={() => handleSelect(product.id)} className="items-start py-2">
                            <div className={cn("mt-1 mr-2 flex h-4 w-4 items-center justify-center shrink-0", selectedId === product.id ? "opacity-100" : "opacity-0")}>
                                <Check className="h-4 w-4" />
                            </div>

                            {/* Product Image */}
                            <div className="mr-3 relative h-10 w-10 shrink-0 rounded bg-muted overflow-hidden border">
                                {product.images[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-accent/50">
                                        <ShoppingBag className="h-4 w-4 opacity-20" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-medium truncate leading-tight mb-0.5">{product.title}</span>
                                {product.variants.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {product.variants.slice(0, 3).map(v => v.sku ? (
                                            <span key={v.id} className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded truncate max-w-[100px]">
                                                {v.sku}
                                            </span>
                                        ) : null)}
                                        {product.variants.length > 3 && (
                                            <span className="text-[10px] text-muted-foreground px-1">+ {product.variants.length - 3}</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground">No variants</span>
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))}

                    {/* Create Option */}
                    {searchTerm && (
                        <>
                            <div className="h-px bg-border my-1" />
                            <DropdownMenuItem onClick={handleCreate} disabled={isCreating} className="text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                                <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                    {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                </div>
                                <span className="font-medium">Create "{searchTerm}"</span>
                            </DropdownMenuItem>
                        </>
                    )}

                    {filteredProducts.length === 0 && !searchTerm && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No products found.
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
