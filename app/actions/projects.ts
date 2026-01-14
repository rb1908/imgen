'use server';

import { prisma } from '@/lib/db';
import { Project } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { uploadImageToStorage } from '@/lib/supabase';

export async function createProject(formData: FormData): Promise<Project> {
    try {
        const imageUrl = formData.get('imageUrl') as string;
        const name = formData.get('name') as string;

        if (!imageUrl) throw new Error("No image URL provided");

        console.log(`[createProject] Creating project with URL: ${imageUrl.substring(0, 50)}...`);

        const project = await prisma.project.create({
            data: {
                originalImageUrl: imageUrl,
                name: name || "Untitled Project"
            }
        });

        revalidatePath('/');
        return project;
    } catch (e) {
        console.error("[createProject] Failed:", e);
        throw e;
    }
}

export async function getProjects() {
    try {
        return await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
            include: { generations: true }
        });
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        // Returning empty array to prevent 500 crash on connection error,
        // allowing the UI to render "No Projects" instead of death.
        return [];
    }
}

export async function getProject(id: string) {
    return await prisma.project.findUnique({
        where: { id },
        include: { generations: { orderBy: { createdAt: 'desc' } } }
    });
}

export async function deleteProject(id: string) {
    await prisma.project.delete({ where: { id } });
    revalidatePath('/');
}

export async function updateProject(id: string, name: string) {
    if (!name || name.trim().length === 0) {
        throw new Error("Name cannot be empty");
    }

    const project = await prisma.project.update({
        where: { id },
        data: { name: name.trim() }
    });

    revalidatePath('/');
    return project;
}
