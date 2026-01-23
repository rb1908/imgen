import { prisma } from '@/lib/db';
import { ProductWorkspace } from '@/components/ProductWorkspace';
import { notFound } from 'next/navigation';
import { getProjectForProduct } from '@/app/actions/projects';
import { getTemplates } from '@/app/actions/templates';


export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // 1. Fetch Product and Templates in parallel
    const [product, templates] = await Promise.all([
        prisma.product.findUnique({
            where: { id },
            include: {
                options: { orderBy: { position: 'asc' } },
                variants: { orderBy: { title: 'asc' } },
                metafields: true
            }
        }),
        getTemplates()
    ]);

    if (!product) {
        notFound();
    }

    // 2. Fetch Project (Dependent on Product) - Do NOT create automatically
    const project = await getProjectForProduct(product.id);

    return (
        <ProductWorkspace
            product={product}
            project={project}
            templates={templates}
        />
    );
}
