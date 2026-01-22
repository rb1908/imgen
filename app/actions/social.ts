'use server';

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export interface SocialDraft {
    id: string;
    content: any; // Json
    platform: string;
    status: string;
    caption?: string;
    imageUrl?: string;
    updatedAt: Date;
}

export async function createDraft(input: {
    imageUrl: string;
    caption?: string;
    platform: string;
    content?: any; // For storing overlay state later
}) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const draft = await db.socialPost.create({
            data: {
                userId,
                platform: input.platform,
                status: 'draft',
                content: input.content || {
                    imageUrl: input.imageUrl,
                    caption: input.caption || ""
                },
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

export async function updateDraft(id: string, updates: { content?: any; status?: string }) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await db.socialPost.update({
            where: { id, userId },
            data: {
                ...updates,
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
