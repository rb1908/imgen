'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
    category: z.string().default('custom'),
});

export async function getTemplates() {
    return await prisma.template.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function createTemplate(formData: FormData) {
    const rawData = {
        name: formData.get('name'),
        prompt: formData.get('prompt'),
        category: formData.get('category') || 'custom',
    };

    const validatedData = CreateTemplateSchema.parse(rawData);

    await prisma.template.create({
        data: validatedData,
    });

    revalidatePath('/templates');
    revalidatePath('/');
}

export async function deleteTemplate(id: string) {
    await prisma.template.delete({
        where: { id },
    });

    revalidatePath('/templates');
    revalidatePath('/');
}
