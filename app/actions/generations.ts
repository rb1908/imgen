'use server';

import { prisma } from '@/lib/db';
import { Generation } from '@prisma/client';

export async function getAllGenerations(limit = 100) {
    try {
        const generations = await prisma.generation.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            include: {
                project: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // We might want to transform this to match a UI type if needed, 
        // but for now returning the raw Prisma result + project name is good.
        // The UI expects something that can be mapped to GeneratedImage.

        return generations;
    } catch (error) {
        console.error("Failed to fetch generations:", error);
        return [];
    }
}
