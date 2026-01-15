'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateProduct(id: string, data: { title: string; description: string; tags: string; price: string; images: string[] }) {
    try {
        await prisma.product.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                tags: data.tags,
                price: data.price,
                images: data.images
            }
        });
        revalidatePath('/products');
        return { success: true };
    } catch (e) {
        console.error("Failed to update product:", e);
        throw new Error("Update failed");
    }
}

export async function addProductImage(productId: string, imageUrl: string) {
    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Product not found");

        const images = product.images || [];
        // Prevent duplicates
        if (!images.includes(imageUrl)) {
            await prisma.product.update({
                where: { id: productId },
                data: {
                    images: [...images, imageUrl] // Append to end
                }
            });
        }
        revalidatePath('/products');
        return { success: true };
    } catch (e) {
        console.error("Failed to add product image:", e);
        return { success: false, error: "Failed to add image" };
    }
}
