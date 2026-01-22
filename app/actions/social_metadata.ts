'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateSocialMetadata(imageUrl: string, tone: 'professional' | 'fun' | 'urgent' = 'fun') {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Fetch image to pass to Gemini
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) throw new Error("Failed to fetch image");
        const arrayBuffer = await imageRes.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imageRes.headers.get("content-type") || "image/png";

        const prompt = `
            Act as a world-class social media manager.
            Analyze the provided product image and generate metadata for a top-performing post.
            
            Tone: ${tone}
            
            Output strictly valid JSON with this schema:
            {
                "title": "Short catchy hook (max 5 words)",
                "caption": "Engaging caption with emojis, spacing, and call to action (max 300 chars)",
                "hashtags": "List of 20 high-traffic, relevant hashtags separated by space"
            }
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType } }
        ]);

        const response = await result.response;
        const text = response.text();

        // Safe JSON parsing
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanedText);

        return { success: true, data };
    } catch (e) {
        console.error("Metadata Generation Failed:", e);
        return { success: false, error: "Failed to generate metadata" };
    }
}
