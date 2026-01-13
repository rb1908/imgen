'use server';

import { prisma } from '@/lib/db';
import { Project } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { uploadImageToStorage } from '@/lib/supabase';

export async function createProject(formData: FormData): Promise<Project> {
    const file = formData.get('image') as File;
    if (!file) throw new Error("No image provided");

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const publicUrl = await uploadImageToStorage(file, fileName, 'images');

    const project = await prisma.project.create({
        data: {
            originalImageUrl: publicUrl,
            name: file.name
        }
    });

    revalidatePath('/');
    return project;
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
