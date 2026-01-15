import { prisma } from '@/lib/db';
import { ProductWorkspace } from '@/components/ProductWorkspace';
import { notFound } from 'next/navigation';
import { getOrCreateProjectForProduct } from '@/app/actions/projects';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // 1. Fetch Product
    const product = await prisma.product.findUnique({
        where: { id }
    });

    if (!product) {
        notFound();
    }

    // 2. Fetch/Create Project
    const project = await getOrCreateProjectForProduct(product);

    // 3. Fetch Templates
    const templates = await prisma.template.findMany({
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <ProductWorkspace
            product={product}
            project={project}
            templates={templates}
        />
    );
}
