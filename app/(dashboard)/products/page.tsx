import { getLocalProducts } from '@/app/actions/shopify';
import { ProductListClient } from '@/components/products/ProductListClient';
import { ProductTemplatesList } from '@/components/products/ProductTemplatesList';

export default async function ProductsPage() {
    const products = await getLocalProducts();

    return (
        <ProductListClient initialProducts={products} />
    );
}
