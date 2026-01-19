'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveAsTemplate(productId: string, templateName: string) {
    try {
        // 1. Fetch Product
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { metafields: true, variants: true } // Need relations? Maybe attributes are in metafields.
        });

        if (!product) throw new Error("Product not found");

        // 2. Prepare Template Data
        const templateData = {
            title: product.title,
            description: product.description,
            price: product.price,
            productType: product.productType,
            tags: product.tags,
            categoryId: product.categoryId,
            vendor: product.vendor,
            // Store attributes (taxonomy metafields)
            attributes: product.metafields.filter(m => m.namespace === 'taxonomy').map(m => ({
                key: m.key,
                value: m.value
            }))
        };

        // 3. Create Template
        const template = await prisma.productTemplate.create({
            data: {
                name: templateName,
                icon: "layout-template", // Default icon
                data: templateData
            }
        });

        revalidatePath('/products'); // Revalidate places where templates might be listed? 
        // Actually templates are used in Launcher, so we revalidate nothing specifically until we have a template list page.

        return { success: true, template };
    } catch (e) {
        console.error("Failed to save template:", e);
        return { success: false, error: "Failed to save template" };
    }
}

export async function getProductTemplates() {
    try {
        const templates = await prisma.productTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return templates;
    } catch (e) {
        console.error("Failed to fetch templates:", e);
        return [];
    }
}
