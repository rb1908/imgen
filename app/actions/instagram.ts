'use server';

import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function publishToInstagram(imageUrl: string, caption: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const integration = await prisma.instagramIntegration.findFirst({
            where: { userId }
        });

        if (!integration) throw new Error("Instagram not connected");

        const { accessToken, instagramId } = integration;

        // Step 1: Create Media Container
        // https://graph.facebook.com/v19.0/{ig-user-id}/media
        const containerUrl = `https://graph.facebook.com/v19.0/${instagramId}/media`;
        const containerParams = new URLSearchParams({
            image_url: imageUrl,
            caption: caption,
            access_token: accessToken
        });

        const containerRes = await fetch(`${containerUrl}?${containerParams.toString()}`, { method: 'POST' });
        const containerData = await containerRes.json();

        if (containerData.error) {
            throw new Error(`IG API Error (Container): ${containerData.error.message}`);
        }

        const creationId = containerData.id;

        // Step 2: Publish Media
        // https://graph.facebook.com/v19.0/{ig-user-id}/media_publish
        const publishUrl = `https://graph.facebook.com/v19.0/${instagramId}/media_publish`;
        const publishParams = new URLSearchParams({
            creation_id: creationId,
            access_token: accessToken
        });

        const publishRes = await fetch(`${publishUrl}?${publishParams.toString()}`, { method: 'POST' });
        const publishData = await publishRes.json();

        if (publishData.error) {
            throw new Error(`IG API Error (Publish): ${publishData.error.message}`);
        }

        return { success: true, postId: publishData.id };

    } catch (error: any) {
        console.error("Instagram Publish Error:", error);
        return { success: false, error: error.message };
    }
}

export async function checkInstagramConnection() {
    const { userId } = await auth();
    if (!userId) return null;

    const integration = await prisma.instagramIntegration.findFirst({
        where: { userId },
        select: { username: true, pageName: true }
    });

    return integration;
}

export async function disconnectInstagram() {
    const { userId } = await auth();
    if (!userId) return { success: false };

    await prisma.instagramIntegration.deleteMany({
        where: { userId }
    });

    return { success: true };
}
