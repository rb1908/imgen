import { getLocalProducts } from '@/app/actions/shopify';
import { ProductListClient } from '@/components/ProductListClient';

export default async function ProductsPage() {
    const products = await getLocalProducts();

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-6 border-b">
                <h1 className="text-2xl font-bold tracking-tight">Product Listings</h1>
                <p className="text-muted-foreground">Manage your detailed product inventory and sync with Shopify.</p>
            </div>
            <div className="flex-1 overflow-hidden">
                <ProductListClient initialProducts={products} />
            </div>
        </div>
    );
}
