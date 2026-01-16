import { getLocalProducts } from '@/app/actions/shopify';
import { ProductListClient } from '@/components/ProductListClient';

export default async function ProductsPage() {
    const products = await getLocalProducts();

    return (
        <ProductListClient initialProducts={products} />
    );
}
