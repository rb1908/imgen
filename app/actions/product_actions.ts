'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function createProduct(data: { title: string; description?: string; price?: string; tags?: string; productType?: string; vendor?: string; status?: string }) {
    try {
        const id = randomUUID();
        const product = await prisma.product.create({
            data: {
                id,
                title: data.title,
                description: data.description,
                price: data.price,
                tags: data.tags,
                productType: data.productType,
                vendor: data.vendor,
                images: [],
                status: data.status || 'draft' // Default to draft for local creation
            }
        });
        revalidatePath('/products');
        return { success: true, product };
    } catch (e) {
        console.error("Failed to create product:", e);
        return { success: false, error: "Create failed" };
    }
}

export async function updateProduct(id: string, data: { title: string; description?: string; tags?: string; price?: string; images?: string[]; productType?: string; vendor?: string; status?: string }) {
    try {
        await prisma.product.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                tags: data.tags,
                price: data.price,
                images: data.images,
                productType: data.productType,
                vendor: data.vendor,
                status: data.status
            }
        });
        revalidatePath('/products');
        revalidatePath(`/products/${id}`);
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
        revalidatePath(`/products/${productId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to add product image:", e);
        return { success: false, error: "Failed to add image" };
    }
}

export async function removeProductImage(productId: string, imageUrl: string) {
    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Product not found");

        const images = product.images || [];
        const newImages = images.filter(img => img !== imageUrl);

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                images: newImages
            }
        });

        revalidatePath('/products');
        revalidatePath(`/products/${productId}`);
        return { success: true, product: updatedProduct };
    } catch (e) {
        console.error("Failed to remove product image:", e);
        return { success: false, error: "Failed to remove image" };
    }
}

export async function addProductImages(productId: string, imageUrls: string[]) {
    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Product not found");

        const currentImages = product.images || [];
        // Filter out duplicates that already exist
        const newImages = imageUrls.filter(url => !currentImages.includes(url));

        if (newImages.length > 0) {
            await prisma.product.update({
                where: { id: productId },
                data: {
                    images: [...currentImages, ...newImages]
                }
            });
        }

        // Fetch updated product to return
        const updatedProduct = await prisma.product.findUnique({ where: { id: productId } });

        revalidatePath('/products');
        revalidatePath(`/products/${productId}`);
        return { success: true, count: newImages.length, product: updatedProduct };
    } catch (e) {
        console.error("Failed to add product images:", e);
        return { success: false, error: "Failed to add images" };
    }
}
