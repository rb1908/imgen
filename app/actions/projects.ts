'use server';

import { prisma } from '@/lib/db';
import { Project } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createProject(formData: FormData): Promise<Project> {
    const file = formData.get('image') as File;
    if (!file) throw new Error("No image provided");

    // Convert file to Base64 for local storage (in simple MVP)
    // Ideally upload to S3/Blob, but for now we store Data URI or assume persistence.
    // Given the previous architecture used ephemeral processing, we definitely need to persist this image now.
    // For this environment, I'll convert to Data URI to store in DB as string (NOT OPTIMAL for production, but fits current "local db" pattern).
    // Or better: write to public/uploads? No, let's keep it simple with Database storage for this "Nano Banana" demo if files are small.
    // The previous flow used `buffer.toString('base64')`. 

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const project = await prisma.project.create({
        data: {
            originalImageUrl: dataUrl,
            name: file.name
        }
    });

    revalidatePath('/');
    return project;
}

export async function getProjects() {
    return await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: { generations: true }
    });
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
