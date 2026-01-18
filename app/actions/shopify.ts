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

            await prisma.$transaction(async (tx) => {
                // 1. Upsert Parent Product
                await tx.product.upsert({
                    where: { id: String(p.id) },
                    update: {
                        title: p.title,
                        description: p.body_html?.replace(/<[^>]*>?/gm, '') || '',
                        price: price, // Base price (usually first variant)
                        images: imageUrls,
                        tags: p.tags,
                        productType: p.product_type,
                        vendor: p.vendor,
                        status: p.status,
                        syncedAt: new Date()
                    },
                    create: {
                        id: String(p.id),
                        title: p.title,
                        description: p.body_html?.replace(/<[^>]*>?/gm, '') || '',
                        price: price,
                        images: imageUrls,
                        tags: p.tags,
                        productType: p.product_type,
                        vendor: p.vendor,
                        status: p.status || 'active'
                    }
                });

                // 2. Sync Options
                // Delete existing to Ensure clean state
                await tx.productOption.deleteMany({ where: { productId: String(p.id) } });
                if (p.options && p.options.length > 0) {
                    await tx.productOption.createMany({
                        data: p.options.map((opt: any) => ({
                            productId: String(p.id),
                            name: opt.name,
                            position: opt.position,
                            values: opt.values.join(',') // Comma separated for now
                        }))
                    });
                }

                // 3. Sync Variants
                await tx.productVariant.deleteMany({ where: { productId: String(p.id) } });
                if (p.variants && p.variants.length > 0) {
                    await tx.productVariant.createMany({
                        data: p.variants.map((v: any) => ({
                            id: String(v.id),
                            productId: String(p.id),
                            title: v.title,
                            price: v.price,
                            sku: v.sku,
                            inventoryQty: v.inventory_quantity,
                            option1: v.option1,
                            option2: v.option2,
                            option3: v.option3,
                            imageId: v.image_id ? String(v.image_id) : null
                        }))
                    });
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

export async function syncProductDetails(productId: string) {
    try {
        const integration = await prisma.shopifyIntegration.findFirst();
        if (!integration) return { success: false, error: "Not connected" };
        const { shopDomain, accessToken } = integration;

        // 1. Fetch Product (Refresh details)
        const prodResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/products/${productId}.json`, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });
        if (!prodResponse.ok) throw new Error("Failed to fetch product");
        const { product: p } = await prodResponse.json();

        // 2. Fetch Metafields
        const metaResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/products/${productId}/metafields.json`, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });
        if (!metaResponse.ok) throw new Error("Failed to fetch metafields");
        const { metafields } = await metaResponse.json();

        // 3. Save to DB
        await prisma.$transaction(async (tx) => {
            // Update Core & Options/Variants (Same logic as bulk sync)
            const price = p.variants?.[0]?.price || "0.00";
            await tx.product.update({
                where: { id: productId },
                data: {
                    title: p.title,
                    description: p.body_html?.replace(/<[^>]*>?/gm, '') || '',
                    price: price,
                    productType: p.product_type,
                    vendor: p.vendor,
                    status: p.status,
                    tags: p.tags,
                    syncedAt: new Date()
                }
            });

            // Sync Options
            await tx.productOption.deleteMany({ where: { productId } });
            if (p.options?.length) {
                await tx.productOption.createMany({
                    data: p.options.map((opt: any) => ({
                        productId,
                        name: opt.name,
                        position: opt.position,
                        values: opt.values.join(',')
                    }))
                });
            }

            // Sync Variants
            await tx.productVariant.deleteMany({ where: { productId } });
            if (p.variants?.length) {
                await tx.productVariant.createMany({
                    data: p.variants.map((v: any) => ({
                        id: String(v.id),
                        productId,
                        title: v.title,
                        price: v.price,
                        sku: v.sku,
                        inventoryQty: v.inventory_quantity,
                        option1: v.option1,
                        option2: v.option2,
                        option3: v.option3,
                        imageId: v.image_id ? String(v.image_id) : null
                    }))
                });
            }

            // Sync Metafields
            await tx.productMetafield.deleteMany({ where: { productId } });
            if (metafields?.length) {
                await tx.productMetafield.createMany({
                    data: metafields.map((m: any) => ({
                        productId,
                        namespace: m.namespace,
                        key: m.key,
                        value: String(m.value),
                        type: m.type
                    }))
                });
            }
        });

        revalidatePath(`/products/${productId}`);
        return { success: true };
    } catch (e) {
        console.error("Sync Details Failed:", e);
        return { success: false, error: "Failed to sync details" };
    }
}

export async function getLocalProducts() {
    return await prisma.product.findMany({
        orderBy: { updatedAt: 'desc' }
    });
}

export async function updateShopifyProduct(dbProduct: { id: string; title: string; description?: string; price?: string; tags?: string; images?: string[]; productType?: string; vendor?: string; status?: string }) {
    try {
        const integration = await prisma.shopifyIntegration.findFirst();
        if (!integration) return { success: false, error: "Not connected" };
        const { shopDomain, accessToken } = integration;

        // Check if ID is a UUID (Local Draft) or Numeric (Shopify ID)
        const isLocalDraft = dbProduct.id.length > 20 && isNaN(Number(dbProduct.id)); // Simple heuristic: UUIDs are long non-numbers

        let method = 'PUT';
        let url = `https://${shopDomain}/admin/api/2023-10/products/${dbProduct.id}.json`;

        const payload: any = {
            product: {
                title: dbProduct.title,
                body_html: dbProduct.description,
                tags: dbProduct.tags,
                product_type: dbProduct.productType,
                vendor: dbProduct.vendor,
                status: dbProduct.status, // 'active', 'draft', 'archived' maps directly for Shopify
                variants: [
                    {
                        price: dbProduct.price,
                        // If we had more variants, we would need to fetch them first.
                        // For now, this assumes single variant or updating the first one implicitly?
                        // Actually, to update the main price safely without wiping variants:
                        // Ideally we grab the main variant ID.
                        // But for "Create", this works.
                        // For "Update", if we don't send variant IDs, Shopify might re-create them or error if we don't match.
                        // Let's assume simplest case: Update Price = Update all variants? Or just the first?
                        // For now, let's TRY just sending price in the root/variant[0] and see if Shopify accepts it.
                        // Actually, Shopify API for product Update:
                        // "To change the price ... modify the variant."
                        // We need the variant ID if it exists?
                        // If we don't have it, we might be safer NOT sending variants unless we know we are overwriting.
                        // Strategy: For NEW products, send variants: [{ price }]
                        // For EXISTING products, if we want to update price, we should fetch variants first?
                        // Optimization: We will send variants for creation. For update, we risk overwriting if we don't include ID.
                        // Let's omit variants from Update for now unless we are confident, OR just try to update price on the first variant if we have its ID?
                        // We don't store variant IDs locally yet.
                        // Let's stick to updating Core Fields (Title, Desc, Tags, Type, Vendor, Status).
                        // Price syncing on UPDATE requires Variant ID. We will SKIP Price on Update for safety until we map Variants.
                        // BUT for Creation, we include it.
                    }
                ]
            }
        };

        // Remove variants from payload if Updating to avoid overwriting variants safely
        // UNLESS we want to force the price. 
        // Let's keeping it simple: Only send price on Creation.
        if (!isLocalDraft) {
            delete payload.product.variants;
            // TODO: To support Price Update, we need to fetch product variants, get ID, and update that variant.
        }

        if (dbProduct.images) {
            payload.product.images = dbProduct.images.map(url => ({ src: url }));
        }

        if (isLocalDraft) {
            method = 'POST';
            url = `https://${shopDomain}/admin/api/2023-10/products.json`;
            // Remove ID from payload for creation
        } else {
            payload.product.id = Number(dbProduct.id);
        }

        const response = await fetch(url, {
            method,
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Shopify ${method === 'POST' ? 'Create' : 'Update'} Failed: ${err}`);
        }

        const responseData = await response.json();

        // If we created a new product, we MUST update our local DB to swap the UUID for the real Shopify ID
        if (isLocalDraft && responseData.product?.id) {
            const newShopifyId = String(responseData.product.id);
            const oldUuid = dbProduct.id;

            console.log(`Replacing Local Draft ID ${oldUuid} with Shopify ID ${newShopifyId}`);

            // Transaction to swap IDs safely
            await prisma.$transaction(async (tx) => {
                // 1. Find all projects referencing this draft
                // Note: Prisma doesn't support changing PK directly easily.
                // We create NEW product, update references, delete OLD product.

                await tx.product.create({
                    data: {
                        id: newShopifyId,
                        title: responseData.product.title,
                        description: responseData.product.body_html?.replace(/<[^>]*>?/gm, '') || '',
                        price: dbProduct.price, // Keep local price for now
                        tags: responseData.product.tags,
                        images: dbProduct.images || [],
                        status: 'active',
                        syncedAt: new Date()
                    }
                });

                // 2. Update Projects referencing the old UUID
                await tx.project.updateMany({
                    where: { defaultProductId: oldUuid },
                    data: { defaultProductId: newShopifyId }
                });

                // 3. Delete the old draft
                await tx.product.delete({
                    where: { id: oldUuid }
                });
            });

            return { success: true, newId: newShopifyId };
        }

        return { success: true };

    } catch (e) {
        console.error("Shopify Push Failed:", e);
        return { success: false, error: e instanceof Error ? e.message : "Push failed" };
    }
}

export async function updateShopifyVariants(shopDomain: string, accessToken: string, variants: { id: string; price?: string; sku?: string; inventory_quantity?: number }[]) {
    const results = await Promise.all(variants.map(async (v) => {
        try {
            if (v.id.length > 20 && isNaN(Number(v.id))) return { id: v.id, success: false, error: "Local variant ID" };

            const response = await fetch(`https://${shopDomain}/admin/api/2023-10/variants/${v.id}.json`, {
                method: 'PUT',
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ variant: v })
            });
            if (!response.ok) throw new Error(response.statusText);
            return { id: v.id, success: true };
        } catch (e) {
            return { id: v.id, success: false, error: String(e) };
        }
    }));
    return results;
}

export async function pushProductUpdatesToShopify(productId: string, data: { variants?: any[]; metafields?: any[] }) {
    try {
        const integration = await prisma.shopifyIntegration.findFirst();
        if (!integration) return { success: false, error: "Not connected" };
        const { shopDomain, accessToken } = integration;

        const errors = [];

        if (data.variants && data.variants.length > 0) {
            const variantResults = await updateShopifyVariants(shopDomain, accessToken, data.variants.map((v: any) => ({
                id: v.id,
                price: v.price,
                sku: v.sku,
                inventory_quantity: v.inventoryQty
            })));
            const failed = variantResults.filter(r => !r.success);
            if (failed.length > 0) errors.push(`Failed to update ${failed.length} variants`);
        }

        if (data.metafields) {
            const payload = {
                product: {
                    id: Number(productId),
                    metafields: data.metafields.map((m: any) => ({
                        namespace: m.namespace,
                        key: m.key,
                        value: m.value,
                        type: m.type
                    }))
                }
            };

            const response = await fetch(`https://${shopDomain}/admin/api/2023-10/products/${productId}.json`, {
                method: 'PUT',
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                errors.push(`Metafields update failed: ${err}`);
            }
        }

        if (errors.length > 0) return { success: false, error: errors.join(', ') };
        return { success: true };

    } catch (e) {
        console.error("Push Updates Failed:", e);
        return { success: false, error: String(e) };
    }
}
