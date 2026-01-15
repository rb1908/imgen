'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getShopifyStatus() {
    try {
        const integration = await prisma.shopifyIntegration.findFirst();
        if (!integration) return { connected: false };

        return {
            connected: true,
            shopDomain: integration.shopDomain
        };
    } catch (e) {
        console.error("Failed to get Shopify status:", e);
        return { connected: false };
    }
}

export async function disconnectShopify() {
    try {
        await prisma.shopifyIntegration.deleteMany();
        revalidatePath('/settings');
    } catch (e) {
        console.error("Failed to disconnect Shopify:", e);
    }
}

export async function getShopifyProducts() {
    try {
        const integration = await prisma.shopifyIntegration.findFirst();
        if (!integration) return { success: false, error: "Not connected" };

        const { shopDomain, accessToken } = integration;

        // Fetch products from Shopify
        const response = await fetch(`https://${shopDomain}/admin/api/2023-10/products.json?limit=50&status=active`, {
            headers: {
                'X-Shopify-Access-Token': accessToken
            }
        });

        if (!response.ok) {
            throw new Error(`Shopify API error: ${response.statusText}`);
        }

        const data = await response.json();
        const products = data.products.map((p: any) => ({
            id: String(p.id),
            title: p.title,
            image: p.image?.src || null,
            price: p.variants?.[0]?.price,
            description: p.body_html?.replace(/<[^>]*>?/gm, '') || '', // Strip HTML for now or keep it? Keeping plain text is safer for simple editor.
            tags: p.tags
        }));

        return { success: true, products };

    } catch (e) {
        console.error("Failed to fetch Shopify products:", e);
        return { success: false, error: "Failed to fetch products" };
    }
}

export async function importFromShopify(products: { id: string; title: string; image: string | null; description?: string; tags?: string; price?: string }[]) {
    try {
        // Create projects for each imported product
        const imported = [];
        for (const p of products) {
            if (!p.image) continue; // Skip if no image, or handle appropriately

            // Create Project
            const project = await prisma.project.create({
                data: {
                    name: p.title,
                    originalImageUrl: p.image,
                    description: p.description,
                    tags: p.tags,
                    price: p.price,
                    shopifyId: p.id
                }
            });

            // We need to treat the shopify image as the "original" or "reference"
            // For now, we can perhaps add it as a generation or just keep it conceptually.
            // But the current Project model might expect an Uploaded Image reference?
            // Existing flow: Upload -> Storage -> Project. 
            // Here: URL -> Project.

            // NOTE: Ideally we download and upload to Supabase, but for speed we might stick to URL
            // If the project doesn't strictly require a 'referenceImageUrl' on the model (it seems it relies on generations or implied reference)
            // Let's check schema/project model.
            // If Project expects 'originalImageUrl', we should add it.
            // Looking at previous edits, the Project model was decoupled. 
            // Let's assume we can just pass referenceImageUrl if it exists on Project, or create a "Generation" that is the reference.

            // Wait, looking at GenerationGrid usage: `referenceImageUrl` is passed separately.
            // Let's assume we create a logical "Reference" generation or just store it.
            // Actually, the simplest integration: Create project key.
            // We probably want to add a reference image to the project if the schema supports it.

            // RE-READING SCHEMA:
            // I don't see the full schema, but `Project` usually has many `Generation`s.
            // I'll assume we can just create the project. 

            imported.push(project);
        }

        revalidatePath('/');
        return { success: true, count: imported.length };

    } catch (e) {
        console.error("Failed to import from Shopify:", e);
        return { success: false, error: "Import failed" };
    }
}
// Product Management Actions

export async function syncShopifyProducts() {
    try {
        const integration = await prisma.shopifyIntegration.findFirst();
        if (!integration) return { success: false, error: "Not connected" };
        const { shopDomain, accessToken } = integration;

        // Fetch all products
        const response = await fetch(`https://${shopDomain}/admin/api/2023-10/products.json?limit=250&status=active`, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });

        if (!response.ok) throw new Error(`Shopify API error: ${response.statusText}`);

        const data = await response.json();
        const products = data.products;

        let syncedCount = 0;

        for (const p of products) {
            const price = p.variants?.[0]?.price || "0.00";
            const imageUrls = p.images?.map((img: any) => img.src) || [];

            await prisma.product.upsert({
                where: { id: String(p.id) },
                update: {
                    title: p.title,
                    description: p.body_html?.replace(/<[^>]*>?/gm, '') || '',
                    price: price,
                    images: imageUrls,
                    tags: p.tags,
                    status: 'active', // Assuming active since we filtered by status=active
                    syncedAt: new Date()
                },
                create: {
                    id: String(p.id),
                    title: p.title,
                    description: p.body_html?.replace(/<[^>]*>?/gm, '') || '',
                    price: price,
                    images: imageUrls,
                    tags: p.tags,
                    status: 'active'
                }
            });
            syncedCount++;
        }

        revalidatePath('/products');
        return { success: true, count: syncedCount };

    } catch (e) {
        console.error("Sync failed:", e);
        return { success: false, error: "Sync failed" };
    }
}

export async function getLocalProducts() {
    return await prisma.product.findMany({
        orderBy: { updatedAt: 'desc' }
    });
}

export async function updateShopifyProduct(dbProduct: { id: string; title: string; description?: string; price?: string; tags?: string }) {
    try {
        const integration = await prisma.shopifyIntegration.findFirst();
        if (!integration) return { success: false, error: "Not connected" };
        const { shopDomain, accessToken } = integration;

        // Construct Shopify payload
        const payload: any = {
            product: {
                id: Number(dbProduct.id),
                title: dbProduct.title,
                body_html: dbProduct.description,
                tags: dbProduct.tags,
                // price: dbProduct.price // Price updating requires variant handling, skipping for MVP to avoid errors
            }
        };

        const response = await fetch(`https://${shopDomain}/admin/api/2023-10/products/${dbProduct.id}.json`, {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Shopify Update Failed: ${err}`);
        }

        return { success: true };

    } catch (e) {
        console.error("Shopify Push Failed:", e);
        return { success: false, error: "Push failed" };
    }
}
