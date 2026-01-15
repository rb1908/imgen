'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateProduct(id: string, data: { title: string; description: string; tags: string; price: string }) {
    try {
        await prisma.product.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                tags: data.tags,
                price: data.price
            }
        });
        revalidatePath('/products');
        return { success: true };
    } catch (e) {
        console.error("Failed to update product:", e);
        throw new Error("Update failed");
    }
}
