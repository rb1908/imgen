"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { getLocalProducts } from '@/app/actions/shopify';
import { setProjectDefaultProduct } from '@/app/actions/projects';
import { createProduct } from '@/app/actions/product_actions';
import { Product } from '@prisma/client';
import { toast } from 'sonner';
import { ShoppingBag, Check, ChevronsUpDown, Plus, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';

interface ProductSelectorProps {
    projectId: string;
    initialDefaultProductId: string | null;
}

export function ProductSelector({ projectId, initialDefaultProductId }: ProductSelectorProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedId, setSelectedId] = useState<string | undefined>(initialDefaultProductId || undefined);
    const [loading, setLoading] = useState(true);

    // Combobox State
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getLocalProducts().then(data => {
            setProducts(data);
            setLoading(false);
        });
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (open && inputRef.current) {
            // Small timeout to allow animation to start/layout to stabilize
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setSearchTerm(''); // Reset search on close
        }
    }, [open]);

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
                // Add to local list optimistically
                const newProduct = res.product as Product;
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

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    const selectedProduct = products.find(p => p.id === selectedId);

    if (loading) return null;

    return (
        <div className="relative" ref={wrapperRef}>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className="w-[240px] justify-between text-xs h-8 bg-transparent border-dashed border-border hover:bg-accent/50 hover:border-solid transition-all"
            >
                <div className="flex items-center truncate">
                    <ShoppingBag className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate max-w-[180px]">
                        {selectedProduct ? selectedProduct.title : "Link to Product..."}
                    </span>
                </div>
                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
            </Button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full mt-1 w-[300px] z-50 rounded-md border bg-popover shadow-lg overflow-hidden flex flex-col"
                    >
                        {/* Search Input */}
                        <div className="flex items-center border-b px-2 py-1 sticky top-0 bg-popover z-10">
                            <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                            <input
                                ref={inputRef}
                                className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                placeholder="Search or create..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoComplete="off"
                            />
                        </div>

                        {/* List */}
                        <div className="max-h-[240px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-border">
                            {/* Unlink Option */}
                            <div
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                onClick={() => handleSelect(null)}
                            >
                                <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                    {!selectedId && <Check className="h-4 w-4 text-primary" />}
                                </div>
                                <span className="opacity-70">No Link</span>
                            </div>

                            {/* Existing Products */}
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                    onClick={() => handleSelect(product.id)}
                                >
                                    <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                        {selectedId === product.id && <Check className="h-4 w-4 text-primary" />}
                                    </div>
                                    <span className="truncate">{product.title}</span>
                                </div>
                            ))}

                            {/* Empty State / Create Option */}
                            {filteredProducts.length === 0 && !searchTerm && (
                                <div className="py-6 text-center text-xs text-muted-foreground">
                                    No products found.
                                </div>
                            )}

                            {/* Create Action */}
                            {searchTerm && (
                                <>
                                    <div className="h-px bg-border my-1" />
                                    <div
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 hover:text-blue-700 transition-colors font-medium",
                                            isCreating && "opacity-50 pointer-events-none"
                                        )}
                                        onClick={handleCreate}
                                    >
                                        <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                            {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                        </div>
                                        <span>Create "{searchTerm}"</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
