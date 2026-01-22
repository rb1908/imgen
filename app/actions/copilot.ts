'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CanvasCommand } from '@/lib/canvas/commands';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `
You are an AI Copilot for a design canvas. 
Your goal is to translate natural language user requests into a list of structured JSON commands.

AVAILABLE COMMANDS:
1. ADD_TOOL: { type: 'ADD_TOOL', toolType: string, x?: number, y?: number }
   - toolTypes: 'tool.knife', 'tool.spatula', 'tool.brush', 'board.cuttingBoard'
   - Logic: If user asks for an object, try to map it to a toolType. If not found, ignore or pick closest.
   - Default x,y: 540, 540 (center of 1080x1080 canvas) if not specified or implied "center".

2. ADD_TEXT: { type: 'ADD_TEXT', content: string, style?: string, x?: number, y?: number }
   - Styles: 'modern', 'classic', 'bold'
   - Default style: 'modern'
   - Default x,y: 540, 540

3. MOVE_OBJECT: { type: 'MOVE_OBJECT', id: string, dx: number, dy: number }
   - Use this if user says "move it right", "move down".
   - If ID is unknown, you can't really do this unless context is passed, but for now assuming selected object or implicit context isn't fully available yet. 
   - *Constraint*: For this v1, mostly focus on ADD commands unless you get specific IDs.

4. LOGIC RULES:
   - If the user asks for "knife", return ADD_TOOL with 'tool.knife'.
   - If the user asks for "text saying Hello", return ADD_TEXT with 'Hello'.
   - Return ONLY a raw JSON array of commands. No markdown.

EXAMPLE INPUT: "Add a knife and text saying Sale"
EXAMPLE OUTPUT:
[
  { "type": "ADD_TOOL", "toolType": "tool.knife", "x": 500, "y": 500 },
  { "type": "ADD_TEXT", "content": "Sale", "x": 500, "y": 600 }
]
`;

export async function generateCanvasCommands(
    input: string,
    context: any // Scene context (selectedId, etc) - for v2
): Promise<CanvasCommand[]> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Fast model

        const prompt = `User Request: "${input}"\nScene Context: ${JSON.stringify(context)}`;

        const result = await model.generateContent({
            contents: [
                { role: 'model', parts: [{ text: SYSTEM_INSTRUCTION }] },
                { role: 'user', parts: [{ text: prompt }] }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const text = result.response.text();
        console.log("Copilot Output:", text);

        const commands = JSON.parse(text);

        if (!Array.isArray(commands)) {
            throw new Error("AI did not return an array");
        }

        return commands;

    } catch (e) {
        console.error("Copilot Error:", e);
        return [];
    }
}
