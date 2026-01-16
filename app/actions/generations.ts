'use server';

import { prisma } from '@/lib/db';
import { Generation } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getAllGenerations(limit = 100, query = '') {
    try {
        const where: any = {};
        if (query) {
            where.OR = [
                { promptUsed: { contains: query, mode: 'insensitive' } },
                { project: { name: { contains: query, mode: 'insensitive' } } }
            ];
        }

        const generations = await prisma.generation.findMany({
            where,
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
        revalidatePath('/generations');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete generations:", error);
        return { success: false, error: 'Failed to delete generations' };
    }
}
