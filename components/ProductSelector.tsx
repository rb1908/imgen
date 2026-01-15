"use client";

import { useEffect, useState } from 'react';
import { getLocalProducts } from '@/app/actions/shopify';
import { setProjectDefaultProduct } from '@/app/actions/projects';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from '@prisma/client';
import { toast } from 'sonner';
import { ShoppingBag } from 'lucide-react';

interface ProductSelectorProps {
    projectId: string;
    initialDefaultProductId: string | null;
}

export function ProductSelector({ projectId, initialDefaultProductId }: ProductSelectorProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedId, setSelectedId] = useState<string | undefined>(initialDefaultProductId || undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLocalProducts().then(data => {
            setProducts(data);
            setLoading(false);
        });
    }, []);

    const handleValueChange = async (value: string) => {
        setSelectedId(value);
        const res = await setProjectDefaultProduct(projectId, value === 'none' ? null : value);
        if (res.success) {
            toast.success(value === 'none' ? "Unlinked" : "Linked to product");
        } else {
            toast.error("Failed to link");
        }
    };

    if (loading) return null;

    return (
        <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedId || 'none'} onValueChange={handleValueChange}>
                <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="Link to Product" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">No Link</SelectItem>
                    {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
