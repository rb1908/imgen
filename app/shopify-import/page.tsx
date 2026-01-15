import { ShopifyImportClient } from '@/components/ShopifyImportClient';

export default function ShopifyImportPage() {
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Import from Shopify</h1>
                <p className="text-muted-foreground">Select products to create projects from.</p>
            </div>

            <ShopifyImportClient />
        </div>
    );
}
