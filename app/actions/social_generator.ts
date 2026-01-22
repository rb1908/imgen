'use server';

// Temporary mock action for UI development
// This will eventually coordinate `generateSocialImage` and `generateSocialMetadata`

export interface SocialPostVariant {
    id: string;
    imageUrl: string;
    caption: string;
    platform: 'instagram' | 'pinterest' | 'etsy';
}

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function generatePostVariants(
    inputImage: string,
    vibe: string
): Promise<{ success: boolean, variants?: SocialPostVariant[], error?: string }> {

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
        You are a social media manager. 
        Generate 3 distinct social post variants for a product with the vibe: "${vibe}".
        
        INPUT CONTEXT:
        - Image URL: ${inputImage} (Do not analyze the image content deeply for now, just trust the vibe).
        - Vibe: ${vibe}

        OUTPUT REQUIREMENTS:
        - Return a JSON array of 3 objects.
        - Each object must have:
          - "caption": Engaging caption with emojis and hashtags.
          - "platform": One for "instagram", one for "pinterest", one for "etsy" (listing title/desc style).
        
        Example:
        [
            { "caption": "...", "platform": "instagram" }
        ]
        `;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const text = result.response.text();
        const data = JSON.parse(text);

        if (!Array.isArray(data)) throw new Error("Invalid AI response");

        // Map to variants
        const variants: SocialPostVariant[] = data.map((item: any, i: number) => ({
            id: Math.random().toString(36).substr(2, 9),
            imageUrl: inputImage, // Using original image. In future V2 we can use GenAI to edit the image too.
            caption: item.caption,
            platform: item.platform || 'instagram'
        }));

        return { success: true, variants };

    } catch (error) {
        console.error("Social Gen Error:", error);
        return { success: false, error: "AI Failed to generate posts" };
    }
}
