'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from "@clerk/nextjs/server";

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

        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // 3. Create Template
        const template = await prisma.productTemplate.create({
            data: {
                name: templateName,
                icon: "layout-template", // Default icon
                data: templateData,
                userId
            }
        });

        revalidatePath('/products');
        revalidatePath('/settings/templates');

        return { success: true, template };
    } catch (e) {
        console.error("Failed to save template:", e);
        return { success: false, error: "Failed to save template" };
    }
}

export async function getProductTemplates() {
    try {
        const { userId } = await auth();
        if (!userId) return [];

        const templates = await prisma.productTemplate.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return templates;
    } catch (e) {
        console.error("Failed to fetch templates:", e);
        return [];
    }
}

export async function deleteProductTemplate(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await prisma.productTemplate.delete({
            where: { id, userId }
        });

        revalidatePath('/settings/templates');
        return { success: true };
    } catch (e) {
        console.error("Failed to delete template:", e);
        return { success: false, error: "Failed to delete template" };
    }
}

export async function updateProductTemplate(id: string, name: string, data: any) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const template = await prisma.productTemplate.update({
            where: { id, userId },
            data: {
                name,
                data
            }
        });

        revalidatePath('/settings/templates');
        return { success: true, template };
    } catch (e) {
        console.error("Failed to update template:", e);
        return { success: false, error: "Failed to update template" };
    }
}
