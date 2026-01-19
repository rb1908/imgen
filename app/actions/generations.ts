'use server';

import { prisma } from '@/lib/db';
import { Generation } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';

import { auth } from '@clerk/nextjs/server';

export async function getAllGenerations(limit = 100, query = '') {
    try {
        const { userId } = await auth();
        if (!userId) return [];

        const where: any = {
            project: { userId } // Filter by project ownership
        };
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
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // Fetch generations first to get projectIds for revalidation
        const generationsToDelete = await prisma.generation.findMany({
            where: {
                id: { in: ids },
                project: { userId } // Verify ownership
            },
            select: { projectId: true }
        });

        await prisma.generation.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });

        revalidatePath('/generations');

        // Revalidate associated projects
        const projectIds = new Set(generationsToDelete.map(g => g.projectId).filter(Boolean));
        for (const pid of projectIds) {
            revalidateTag(`project-${pid}`, {});
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to delete generations:", error);
        return { success: false, error: 'Failed to delete generations' };
    }
}
