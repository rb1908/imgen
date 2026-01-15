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
