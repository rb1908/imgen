import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Found models:");
            const target = data.models.find((m: any) => m.name.includes("gemini-3"));
            if (target) {
                console.log("TARGET FOUND:", JSON.stringify(target, null, 2));
            } else {
                console.log("Gemini 3 models NOT found in list. Available models like 'gemini':");
                data.models.filter((m: any) => m.name.includes("gemini")).forEach((m: any) => console.log(m.name));
            }
        } else {
            console.log("No models returned or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
