'use server';

import { prisma } from '@/lib/db';
import { Project } from '@prisma/client';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { uploadImageToStorage } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Helper for signed URLs
export async function getSignedUploadUrl(fileName: string, fileType: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role for admin privileges
    );

    const path = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    const { data, error } = await supabase.storage
        .from('images')
        .createSignedUploadUrl(path);

    if (error || !data) {
        console.error("Signed URL Error:", error);
        throw new Error("Failed to get signed URL");
    }

    return { signedUrl: data.signedUrl, path, publicUrl: null };
}

export async function getPublicUrl(path: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = supabase.storage
        .from('images')
        .getPublicUrl(path);
    return data.publicUrl;
}


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

        revalidatePath('/projects');
        revalidatePath('/');
        return project;
    } catch (e) {
        console.error("[createProject] Failed:", e);
        throw e;
    }
}

export async function getProjects() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                originalImageUrl: true,
                createdAt: true,
                updatedAt: true,
                description: true,
                tags: true,
                price: true,
                shopifyId: true,
                defaultProductId: true,
                _count: {
                    select: { generations: true }
                },
                generations: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        imageUrl: true,
                        createdAt: true
                    }
                }
            }
        });
        return projects;
    } catch (e) {
        console.error("Failed to fetch projects:", e);
        return [];
    }
}


export async function updateProjectMetadata(id: string, data: { description?: string; tags?: string; price?: string }) {
    try {
        await prisma.project.update({
            where: { id },
            data
        });
        revalidateTag(`project-${id}`);
        revalidatePath(`/project/${id}`); // Keep path revalidation for client router cache
        revalidatePath('/projects');
        return { success: true };
    } catch (e) {
        console.error("Failed to update project metadata:", e);
        return { success: false, error: "Update failed" };
    }
}

// Cached getProject
export const getProject = async (id: string) => {
    return await unstable_cache(
        async () => {
            return await prisma.project.findUnique({
                where: { id },
                include: { generations: { orderBy: { createdAt: 'desc' } } }
            });
        },
        [`project-${id}`],
        { tags: [`project-${id}`] }
    )();
};

export async function deleteProject(id: string) {
    await prisma.project.delete({ where: { id } });
    revalidateTag(`project-${id}`);
    revalidatePath('/projects');
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

    revalidateTag(`project-${id}`);
    revalidatePath('/projects');
    revalidatePath('/');
    return project;
}

export async function setProjectDefaultProduct(id: string, productId: string | null) {
    try {
        await prisma.project.update({
            where: { id },
            data: { defaultProductId: productId }
        });
        revalidateTag(`project-${id}`);
        revalidatePath(`/project/${id}`);
        revalidatePath('/projects');
        return { success: true };
    } catch (e) {
        console.error("Failed to set default product:", e);
        return { success: false, error: "Failed to link product" };
    }
}

export async function getOrCreateProjectForProduct(product: { id: string; title: string; images: string[] }) {
    try {
        // 1. Try to find existing project linked to this product
        const existing = await prisma.project.findFirst({
            where: { defaultProductId: product.id },
            include: { generations: { orderBy: { createdAt: 'desc' } } }
        });

        if (existing) return existing;

        // 2. Create new project if none exists
        // Use first product image or a placeholder
        const flowImageUrl = product.images[0] || "https://placehold.co/600x400?text=No+Image";

        const newProject = await prisma.project.create({
            data: {
                name: product.title,
                originalImageUrl: flowImageUrl,
                defaultProductId: product.id,
                description: `Workspace for ${product.title}`
            },
            include: { generations: { orderBy: { createdAt: 'desc' } } }
        });

        revalidatePath('/projects');
        return newProject;
    } catch (e) {
        console.error("Failed to get/create project for product:", e);
        throw e;
    }
}
