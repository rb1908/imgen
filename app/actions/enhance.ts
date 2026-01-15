'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function enhancePrompt(prompt: string): Promise<{ enhancedPrompt: string; error?: string }> {
    try {
        if (!prompt || prompt.length < 3) {
            return { enhancedPrompt: prompt, error: "Prompt too short to enhance" };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const systemPrompt = `You are an expert prompt engineer for interior design and product photography generation. 
        Enhance the following short user prompt into a detailed, high-quality image generation prompt.
        Focus on: lighting, texture, composition, and style.
        Keep it under 60 words.
        Output ONLY the enhanced prompt, no conversational text.
        
        User Prompt: "${prompt}"`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        return { enhancedPrompt: text.trim() };
    } catch (error) {
        console.error("Prompt enhancement failed:", error);
        return { enhancedPrompt: prompt, error: "Failed to enhance prompt" };
    }
}
