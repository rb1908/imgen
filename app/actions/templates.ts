'use server';

import { prisma } from '@/lib/db';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { z } from 'zod';
const CreateTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    prompt: z.string().nullable().optional(), // Allow null/optional for Prompt
    description: z.string().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    category: z.string().default('custom'),
});

export const getTemplates = async (purpose: 'prompt' | 'social' = 'prompt') => {
    return await unstable_cache(
        async () => {
            return await prisma.template.findMany({
                where: { purpose },
                orderBy: { createdAt: 'desc' },
                include: {
                    generations: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: { imageUrl: true }
                    }
                }
            });
        },
        [`templates-list-${purpose}`],
        { tags: ['templates'] }
    )();
};

export async function createTemplate(formData: FormData) {
    try {
        const rawData = {
            name: formData.get('name'),
            prompt: formData.get('prompt'),
            description: formData.get('description'),
            thumbnailUrl: formData.get('thumbnailUrl'),
            category: formData.get('category') || 'custom',
        };

        const validatedData = CreateTemplateSchema.parse(rawData);

        const template = await prisma.template.create({
            data: validatedData,
        });

        revalidateTag('templates', {});
        revalidatePath('/', 'layout');

        return { success: true, template };
    } catch (error) {
        console.error("Failed to create template:", error);
        return { success: false, error: "Failed to create template" };
    }
}

export async function updateTemplate(id: string, formData: FormData) {
    try {
        const rawData = {
            name: formData.get('name'),
            prompt: formData.get('prompt'),
            description: formData.get('description'),
            thumbnailUrl: formData.get('thumbnailUrl'),
            category: formData.get('category') || 'custom',
        };

        const validatedData = CreateTemplateSchema.parse(rawData);

        const template = await prisma.template.update({
            where: { id },
            data: validatedData,
        });

        revalidateTag('templates', {});
        revalidatePath('/', 'layout');

        return { success: true, template };
    } catch (error) {
        console.error("Failed to update template:", error);
        return { success: false, error: "Failed to update template" };
    }
}

export async function deleteTemplate(id: string) {
    try {
        await prisma.template.delete({
            where: { id },
        });

        revalidateTag('templates', {});
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete template:", error);
        return { success: false, error: "Failed to delete template" };
    }
}
