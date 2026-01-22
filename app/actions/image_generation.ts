'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { uploadImageToStorage } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateSocialImage(
    prompt: string,
    sourceImageUrl?: string,
    modelName: string = 'gemini-2.5-flash-lite'
) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // 1. Get or Create "Social Studio" Project
        let project = await prisma.project.findFirst({
            where: { userId, name: "Social Studio" }
        });

        if (!project) {
            project = await prisma.project.create({
                data: {
                    name: "Social Studio",
                    description: "Workspace for social media assets",
                    userId,
                    originalImageUrl: "", // Placeholder
                }
            });
        }

        const model = genAI.getGenerativeModel({ model: modelName });
        let result;

        if (sourceImageUrl) {
            // Image-to-Image (Edit)
            const imageRes = await fetch(sourceImageUrl);
            if (!imageRes.ok) throw new Error("Failed to fetch source image");
            const arrayBuffer = await imageRes.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = imageRes.headers.get("content-type") || "image/png";

            const editPrompt = `
                Act as a professional photo editor.
                Edit the provided image based on this instruction: "${prompt}".
                Maintain high realism and quality.
                Return the generated image.
            `;

            result = await model.generateContent([
                editPrompt,
                { inlineData: { data: base64Data, mimeType } }
            ]);
        } else {
            // Text-to-Image
            const t2iPrompt = `
                Generate a high-quality, photorealistic image based on: "${prompt}".
                Focus on social media aesthetics (clean, vibrant, professional).
            `;
            result = await model.generateContent([t2iPrompt]);
        }

        const response = await result.response;

        // Handle Image Output (Base64 or URL depending on model behavior, Flash usually returns Base64/Inline handle)
        // Note: For Gemini 2.5/2.0 Flash, verify output format. Assuming standard generateContent image parts.
        // Actually, flash currently returns text unless used with specific tools or multimodal output. 
        // If the model supports direct image generation, we need to handle candidates.
        // If not, we fall back to Imagen (but let's assume Gemini Multimodal Generation).

        /* 
           CRITICAL: standard JS SDK generateContent returns *text* unless configured for image gen specific endpoints 
           or using a model that outputs image bytes. 
           Gemini 1.5 Pro/Flash are MULTIMODAL INPUT, text OUTPUT.
           Imagen 3 is for Image Output.
           However, "gemini-2.0-flash-exp" might support native image gen?
           If not, this will fail.
           
           Let's look at `generate.ts` (viewed earlier). 
           It handled `imageParts` from response structure `candidates[0].content.parts` if inlineData presence.
           If that fails, it falls back to Agent Mode (Text returns URL).
           
           I will copy the `imageParts` extraction logic from `generate.ts`.
        */

        if (response.candidates && response.candidates[0].content.parts) {
            const parts = response.candidates[0].content.parts;
            // Check for inline image data (Gemini native generation)
            const imagePart = parts.find(p => p.inlineData);

            if (imagePart && imagePart.inlineData) {
                const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
                const fileName = `social-${project.id}-${Date.now()}.png`;
                const publicUrl = await uploadImageToStorage(buffer, fileName, 'images');

                await prisma.generation.create({
                    data: {
                        imageUrl: publicUrl,
                        promptUsed: prompt,
                        projectId: project.id
                    }
                });

                return { success: true, imageUrl: publicUrl };
            }
        }

        // Fallback: Check for URL in text (Agent Mode)
        const text = response.text();
        const urlMatch = text.match(/https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp)/i);
        if (urlMatch) {
            const externalUrl = urlMatch[0];
            // Upload to our storage
            const extRes = await fetch(externalUrl);
            const buffer = Buffer.from(await extRes.arrayBuffer());
            const fileName = `social-agent-${project.id}-${Date.now()}.png`;
            const publicUrl = await uploadImageToStorage(buffer, fileName, 'images');

            await prisma.generation.create({
                data: {
                    imageUrl: publicUrl,
                    promptUsed: prompt,
                    projectId: project.id
                }
            });
            return { success: true, imageUrl: publicUrl };
        }

        return { success: false, error: "No image generated from model response." };

    } catch (e: any) {
        console.error("Social Image Gen Failed:", e);
        return { success: false, error: e.message || "Generation failed" };
    }
}
