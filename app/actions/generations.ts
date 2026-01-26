'use server';
// Force rebuild for prisma client update

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

export async function updateGeneration(id: string, updates: { customizedImageUrl?: string; canvasState?: Record<string, unknown> }) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const generation = await prisma.generation.findFirst({
            where: { id, project: { userId } }
        });

        if (!generation) throw new Error("Generation not found or unauthorized");

        await prisma.generation.update({
            where: { id },
            data: {
                ...updates,
                canvasState: updates.canvasState as any // Prisma Json handling
            }
        });

        revalidatePath('/generations');
        revalidatePath('/projects');
        revalidateTag(`project-${generation.projectId}`, {});
        return { success: true };
    } catch (error) {
        console.error("Failed to update generation:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function getGenerationById(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) return null;

        const generation = await prisma.generation.findFirst({
            where: { id, project: { userId } },
            include: {
                project: true,
                template: true
            }
        });

        return generation;
    } catch (error) {
        console.error("Failed to fetch generation:", error);
        return null;
    }
}

export async function cloneGeneration(
    originalId: string,
    overrides: {
        customizedImageUrl: string;
        canvasState: Record<string, unknown>;
    }
) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const original = await prisma.generation.findFirst({
            where: { id: originalId, project: { userId } }
        });

        if (!original) throw new Error("Original generation not found");

        const newGeneration = await prisma.generation.create({
            data: {
                // Copy basic fields
                imageUrl: original.imageUrl,
                promptUsed: original.promptUsed,
                projectId: original.projectId,
                templateId: original.templateId,

                // Apply new edits
                customizedImageUrl: overrides.customizedImageUrl,
                canvasState: overrides.canvasState as any,
            }
        });

        revalidatePath('/generations');
        revalidatePath('/projects');
        revalidateTag(`project-${original.projectId}`, {});

        return { success: true, generationId: newGeneration.id };
    } catch (error) {
        console.error("Failed to clone generation:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
