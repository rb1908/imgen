'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getEtsyStatus() {
    try {
        const integration = await prisma.etsyIntegration.findFirst();
        if (!integration) return { connected: false };

        // Check expiry (optional, but good for UI)
        const isExpired = new Date() > integration.expiresAt;

        return {
            connected: true,
            shopId: integration.shopId,
            userId: integration.etsyUserId,
            isExpired
        };
    } catch (e) {
        console.error("Failed to get Etsy status:", e);
        return { connected: false };
    }
}

export async function disconnectEtsy() {
    try {
        await prisma.etsyIntegration.deleteMany(); // Delete all (single tenant)
        revalidatePath('/settings');
        return { success: true };
    } catch (e) {
        console.error("Failed to disconnect Etsy:", e);
        return { success: false };
    }
}
