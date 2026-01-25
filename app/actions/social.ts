'use server';

import { prisma as db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export interface SocialDraft {
    id: string;
    content: Record<string, unknown>; // Json
    platform: string;
    status: string;
    caption?: string;
    imageUrl?: string;
    updatedAt: Date;
}

import { z } from "zod";

const CreateDraftSchema = z.object({
    imageUrl: z.string().url(),
    caption: z.string().optional(),
    platform: z.string(),
    content: z.record(z.string(), z.unknown()).optional(),
});

export async function createDraft(input: z.infer<typeof CreateDraftSchema>) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const result = CreateDraftSchema.safeParse(input);
    if (!result.success) {
        return { success: false, error: "Invalid input" };
    }
    const data = result.data;

    try {
        const draft = await db.socialPost.create({
            data: {
                userId,
                platform: data.platform,
                status: 'draft',
                content: (data.content || {
                    imageUrl: data.imageUrl,
                    caption: data.caption || ""
                }) as any,
            }
        });

        revalidatePath('/social');
        return { success: true, draftId: draft.id };
    } catch (error) {
        console.error("Create Draft Error:", error);
        return { success: false, error: "Failed to create draft" };
    }
}

export async function getDrafts() {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const drafts = await db.socialPost.findMany({
            where: { userId, status: 'draft' },
            orderBy: { updatedAt: 'desc' },
        });

        return { success: true, drafts };
    } catch (error) {
        return { success: false, error: "Failed to fetch drafts" };
    }
}

const UpdateDraftSchema = z.object({
    id: z.string(),
    updates: z.object({
        content: z.record(z.string(), z.unknown()).optional(),
        status: z.string().optional(),
    }),
});

export async function updateDraft(id: string, updates: { content?: Record<string, unknown>; status?: string }) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const result = UpdateDraftSchema.safeParse({ id, updates });
    if (!result.success) {
        return { success: false, error: "Invalid input" };
    }

    try {
        await db.socialPost.update({
            where: { id, userId },
            data: {
                ...updates,
                content: updates.content as any,
            }
        });

        revalidatePath('/social');
        revalidatePath(`/social/editor/${id}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update draft" };
    }
}

export async function deleteDraft(id: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await db.socialPost.delete({
            where: { id, userId }
        });
        revalidatePath('/social');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete" };
    }
}

export async function getDraftById(id: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const draft = await db.socialPost.findUnique({
            where: { id, userId }
        });
        return { success: true, draft };
    } catch (error) {
        return { success: false, error: "Not found" };
    }
}
