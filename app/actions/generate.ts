'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';
import { uploadImageToStorage } from '@/lib/supabase';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from "@clerk/nextjs/server";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateVariations({
    projectId,
    mode,
    input, // templateIds[] OR customPrompt
    overrideImageUrl
}: {
    projectId: string;
    mode: 'template' | 'custom';
    input: string[] | string;
    overrideImageUrl?: string;
}) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // 1. Get Project & Image (and verify ownership)
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId }
        });

        if (!project) throw new Error('Project not found');

        // 2. Prepare Image Data (Support both Base64 DB strings and Supabase URLs)
        const dataUrl = overrideImageUrl || project.originalImageUrl;
        let base64Data = "";
        let mimeType = "image/png"; // default

        // Retry helper
        const fetchImageWithRetry = async (url: string, retries = 3): Promise<{ buffer: Buffer, type: string }> => {
            for (let i = 0; i < retries; i++) {
                try {
                    // console.log(`[Fetch] Attempt ${i + 1} for ${url}`);
                    const res = await fetch(url, {
                        signal: AbortSignal.timeout(10000), // 10s timeout
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    if (!res.ok) throw new Error(`Status ${res.status}`);

                    const arrayBuffer = await res.arrayBuffer();
                    const contentType = res.headers.get("content-type") || "image/png";
                    return { buffer: Buffer.from(arrayBuffer), type: contentType };
                } catch (e) {
                    // console.warn(`[Fetch] Attempt ${i + 1} failed:`, e);
                    if (i === retries - 1) throw e;
                    await new Promise(r => setTimeout(r, 1000 * (i + 1))); // backoff
                }
            }
            throw new Error("All retries failed");
        };

        if (dataUrl.startsWith("data:")) {
            // Legacy Base64
            base64Data = dataUrl.split(',')[1];
            mimeType = dataUrl.split(';')[0].split(':')[1];
        } else if (dataUrl.startsWith("http")) {
            // New Supabase Storage URL -> Fetch Buffer with retry
            try {
                const { buffer, type } = await fetchImageWithRetry(dataUrl);
                base64Data = buffer.toString('base64');
                mimeType = type;
            } catch (e) {
                console.error("[Fatal] Failed to download reference image:", dataUrl, e);
                throw new Error("Could not download the reference image. Please try selecting a different one.");
            }
        } else {
            throw new Error(`Invalid image format: ${dataUrl.substring(0, 20)}...`);
        }

        // Prepare tasks
        const tasks: { prompt: string, templateId?: string }[] = [];

        if (mode === 'template' && Array.isArray(input)) {
            const templates = await prisma.template.findMany({
                where: { id: { in: input } }
            });
            templates.forEach((t) => {
                if (t.prompt) {
                    tasks.push({ prompt: t.prompt, templateId: t.id });
                }
            });
        } else if (mode === 'custom' && typeof input === 'string') {
            tasks.push({ prompt: input });
        }

        if (tasks.length === 0) throw new Error("No properties to generate");

        // Generic Generation Function
        const generateTask = async (task: { prompt: string, templateId?: string }) => {
            const generatedImages = [];
            const modelsToTry = ["gemini-3-pro-image-preview", "gemini-2.0-flash-exp"];

            for (const modelName of modelsToTry) {
                try {
                    console.log(`[Generate] Attempting with ${modelName} for prompt: "${task.prompt.substring(0, 20)}..."`);
                    const imageModel = genAI.getGenerativeModel({ model: modelName });

                    const result = await imageModel.generateContent([
                        task.prompt,
                        { inlineData: { data: base64Data, mimeType } }
                    ]);
                    const response = await result.response;

                    if (response.candidates && response.candidates[0].content.parts) {
                        const parts = response.candidates[0].content.parts;
                        const imageParts = parts.filter(p => p.inlineData && p.inlineData.mimeType.startsWith('image/'));
                        if (imageParts.length > 0) {
                            for (const part of imageParts) {
                                if (part.inlineData) {
                                    // Upload Generated Buffer to Supabase
                                    const buffer = Buffer.from(part.inlineData.data, 'base64');
                                    const fileName = `gen-${projectId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.png`;

                                    // Use helper (accepts Buffer)
                                    const publicUrl = await uploadImageToStorage(buffer, fileName, 'images');

                                    generatedImages.push(await prisma.generation.create({
                                        data: {
                                            imageUrl: publicUrl,
                                            promptUsed: task.prompt,
                                            projectId: projectId,
                                            templateId: task.templateId,
                                        }
                                    }));
                                }
                            }
                            break;
                        }
                    }
                } catch (e) {
                    console.error(`[Generate] Model ${modelName} failed:`, e);
                }
            }

            if (generatedImages.length > 0) return generatedImages;

            // Fallback: Agent Mode (URL)
            try {
                console.log("[Generate] Falling back to Agent Mode...");
                const agentModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
                const agentPrompt = `You are a high-fidelity image renderer.
                 Instruction: "${task.prompt}"
                 STRICT OUTPUT RULES:
                 1. Return generated images DIRECTLY.
                 2. If you generate an image via formatting, output the URL.
                 3. If you cannot generate, say "ERROR".`;

                const result = await agentModel.generateContent([
                    agentPrompt,
                    { inlineData: { data: base64Data, mimeType } }
                ]);
                const text = result.response.text();
                // Simple URL regex extraction
                const urlMatch = text.match(/https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp|gif)/i);
                if (urlMatch) {
                    // Fetch and Upload the Agent URL result to Supabase
                    const externalUrl = urlMatch[0];
                    const extRes = await fetch(externalUrl);
                    if (extRes.ok) {
                        const extBlob = await extRes.arrayBuffer();
                        const buffer = Buffer.from(extBlob);
                        const fileName = `gen-agent-${projectId}-${Date.now()}.png`; // guess png
                        const publicUrl = await uploadImageToStorage(buffer, fileName, 'images');

                        generatedImages.push(await prisma.generation.create({
                            data: {
                                imageUrl: publicUrl, // Storing Supabase URL now!
                                promptUsed: task.prompt,
                                projectId: projectId,
                                templateId: task.templateId
                            }
                        }));
                    }
                }
            } catch (e) {
                console.error("[Generate] Agent fallback failed:", e);
            }

            return generatedImages;
        };

        // Execute
        const results = await Promise.all(tasks.map(t => generateTask(t)));
        const flat = results.flat();

        if (flat.length === 0) {
            console.error("[Generate] All attempts failed. No images generated.");
            throw new Error("Generation failed - Helper Logs checked.");
        }
        if (flat.length > 0) {
            revalidatePath('/generations');
            revalidateTag(`project-${projectId}`, {});
        }
        return flat;

    } catch (error) {
        console.error("[Fatal Generate Error]:", error);
        throw error;
    }
}
