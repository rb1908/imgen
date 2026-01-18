'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchTaxonomy } from './taxonomy';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

interface DraftData {
    title: string;
    description: string;
    price: string;
    productType: string;
    tags: string;
    categoryId?: string; // We will try to resolve this
    categoryLabel?: string;
    materialGuesses?: string[];
}

// Helper to clean JSON
function cleanJson(text: string) {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

export async function generateDraftFromText(prompt: string): Promise<DraftData> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Fast model

    const systemPrompt = `
    You are an e-commerce listing expert.
    Based on the user's description, generate a product listing.
    Return ONLY valid JSON with no markdown formatting.
    Fields required:
    - title: SEO optimized, under 140 chars.
    - description: Engaging, 2-3 paragraphs HTML (use <p>, <ul>).
    - price: Estimated price as a string (e.g. "25.00").
    - productType: Simple type (e.g. "Cushion", "Art").
    - tags: Comma separated string of 5-10 keywords.
    - categorySearchTerm: The best search term to find this product in Shopify Taxonomy (e.g. "Throw Pillows").
    
    User Description: "${prompt}"
    `;

    try {
        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();
        const data = JSON.parse(cleanJson(text));

        // Resolve Category ID
        let categoryId = undefined;
        let categoryLabel = undefined;
        if (data.categorySearchTerm) {
            const matches = await searchTaxonomy(data.categorySearchTerm);
            if (matches.length > 0) {
                // Pick the first one
                categoryId = matches[0].id;
                categoryLabel = matches[0].label;
            }
        }

        return {
            title: data.title,
            description: data.description,
            price: data.price,
            productType: data.productType,
            tags: data.tags,
            categoryId,
            categoryLabel
        };
    } catch (e) {
        console.error("Draft Generation Failed:", e);
        throw new Error("Failed to generate draft");
    }
}

export async function analyzeImageForDraft(base64Image: string, mimeType: string): Promise<DraftData> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Vision compatible

    const systemPrompt = `
    Analyze this product image and generate a listing draft.
    Return ONLY valid JSON with no markdown formatting.
    Fields required:
    - title: Descriptive title.
    - description: High quality description mentioning visual features, colors, and probable materials.
    - price: Estimated market price (just the number/string).
    - productType: e.g. "Vase", "Shirt".
    - tags: Comma separated keywords.
    - materials: Array of guessed materials (e.g. ["Cotton", "Linen"]).
    - categorySearchTerm: A term to search the taxonomy.
    `;

    try {
        const result = await model.generateContent([
            systemPrompt,
            { inlineData: { data: base64Image, mimeType } }
        ]);
        const text = result.response.text();
        const data = JSON.parse(cleanJson(text));

        // Resolve Category ID
        let categoryId = undefined;
        let categoryLabel = undefined;
        if (data.categorySearchTerm) {
            const matches = await searchTaxonomy(data.categorySearchTerm);
            if (matches.length > 0) {
                categoryId = matches[0].id;
                categoryLabel = matches[0].label;
            }
        }

        // Append materials to description if needed or return distinct
        // For now we just return standard fields.

        return {
            title: data.title,
            description: data.description,
            price: data.price,
            productType: data.productType,
            tags: data.tags,
            categoryId,
            categoryLabel,
            materialGuesses: data.materials
        };

    } catch (e) {
        console.error("Image Analysis Failed:", e);
        throw new Error("Failed to analyze image");
    }
}

import { uploadImageToStorage } from '@/lib/supabase';

export async function uploadLauncherImage(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    if (!file) throw new Error("No file uploaded");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `launcher-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.type.split('/')[1]}`;

    return await uploadImageToStorage(buffer, fileName, 'images');
}
