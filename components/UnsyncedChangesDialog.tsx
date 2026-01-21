'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowUpCircle } from 'lucide-react';
import { getUnsyncedProducts, bulkPushProducts } from '@/app/actions/shopify';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface Product {
    id: string;
    title: string;
    images: string[];
    updatedAt: Date;
    syncedAt: Date;
}

interface UnsyncedChangesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UnsyncedChangesDialog({ open, onOpenChange }: UnsyncedChangesDialogProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [pushing, setPushing] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            fetchUnsynced();
        }
    }, [open]);

    const fetchUnsynced = async () => {
        setLoading(true);
        try {
            const res = await getUnsyncedProducts();
            setProducts(res);
            setSelected(res.map((p: any) => p.id)); // Select all by default
        } catch (e) {
            toast.error("Failed to load changes");
        } finally {
            setLoading(false);
        }
    };

    const handlePush = async () => {
        if (selected.length === 0) return;
        setPushing(true);
        try {
            const res = await bulkPushProducts(selected);
            if (res.success) {
                toast.success(`Successfully pushed ${res.count} products!`);
                onOpenChange(false);
            } else {
                toast.error("Some updates failed. Check logs.");
            }
        } catch (e) {
            toast.error("Push failed");
        } finally {
            setPushing(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Review Local Changes</DialogTitle>
                    <DialogDescription>
                        The following products have been modified locally but not pushed to Shopify.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ArrowUpCircle className="w-12 h-12 mb-2 opacity-20" />
                            <p>All changes are synced!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <span className="text-sm text-muted-foreground">{selected.length} selected</span>
                                <Button variant="ghost" size="sm" onClick={() => setSelected(selected.length === products.length ? [] : products.map(p => p.id))}>
                                    {selected.length === products.length ? "Deselect All" : "Select All"}
                                </Button>
                            </div>
                            {products.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        checked={selected.includes(p.id)}
                                        onCheckedChange={() => toggleSelect(p.id)}
                                    />
                                    <div className="relative w-10 h-10 rounded overflow-hidden bg-muted border shrink-0">
                                        {p.images[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{p.title}</h4>
                                        <p className="text-xs text-muted-foreground">Edited {new Date(p.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px]">Modified</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handlePush} disabled={pushing || selected.length === 0 || loading}>
                        {pushing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Push {selected.length} Updates
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
