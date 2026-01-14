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
        return generations;
    } catch (error) {
        console.error("Failed to fetch generations:", error);
        return [];
    }
}

export async function deleteGenerations(ids: string[]) {
    try {
        await prisma.generation.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete generations:", error);
        return { success: false, error: 'Failed to delete generations' };
    }
}
