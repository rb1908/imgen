'use server';

import { prisma } from '@/lib/db';
import { auth } from "@clerk/nextjs/server";

export async function getUserAssets(limit = 50) {
    try {
        const { userId } = await auth();
        if (!userId) return [];

        const projects = await prisma.project.findMany({
            where: { userId },
            select: { originalImageUrl: true },
            orderBy: { createdAt: 'desc' },
            take: limit * 2 // Fetch more to filter uniq
        });

        // Filter unique URLs
        const uniqueUrls = Array.from(new Set(projects.map(p => p.originalImageUrl).filter(Boolean)));

        return uniqueUrls.slice(0, limit).map(url => ({
            id: url, // Use URL as ID for now
            url
        }));
    } catch (e) {
        console.error("Failed to fetch user assets:", e);
        return [];
    }
}
