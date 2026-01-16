import { prisma } from '@/lib/db';
import { ProductWorkspace } from '@/components/ProductWorkspace';
import { notFound } from 'next/navigation';
import { getOrCreateProjectForProduct } from '@/app/actions/projects';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // 1. Fetch Product and Templates in parallel
    const [product, templates] = await Promise.all([
        prisma.product.findUnique({ where: { id } }),
        prisma.template.findMany({ orderBy: { updatedAt: 'desc' } })
    ]);

    if (!product) {
        notFound();
    }

    // 2. Fetch/Create Project (Dependent on Product)
    const project = await getOrCreateProjectForProduct(product);

    return (
        <ProductWorkspace
            product={product}
            project={project}
            templates={templates}
        />
    );
}
