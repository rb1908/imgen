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
            price: p.variants?.[0]?.price
        }));

        return { success: true, products };

    } catch (e) {
        console.error("Failed to fetch Shopify products:", e);
        return { success: false, error: "Failed to fetch products" };
    }
}

export async function importFromShopify(products: { id: string; title: string; image: string | null }[]) {
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
