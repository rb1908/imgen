import { prisma } from '@/lib/db';
import { ProductDetailForm } from '@/components/ProductDetailForm';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await prisma.product.findUnique({
        where: { id }
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-6 border-b flex items-center gap-4">
                <Link href="/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
                    <p className="text-muted-foreground text-sm">Update details and sync with Shopify.</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
                <ProductDetailForm product={product} />
            </div>
        </div>
    );
}
