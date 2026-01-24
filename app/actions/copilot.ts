'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CanvasCommand } from '@/lib/engine/commands';

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

2. ADD_TEXT: { type: 'ADD_TEXT', content: string, style?: any, x?: number, y?: number }
   - style object keys: fontFamily (Str), fill (Hex), fontSize (Num), align ('left'|'center'|'right').
   - Default: { fontFamily: 'Inter', fill: '#000000', fontSize: 40 }
   - Default x,y: 540, 540

3. ADD_SHAPE: { type: 'ADD_SHAPE', shape: 'rect'|'circle'|'triangle'|'star', x?: number, y?: number, color?: string }
   - Default color: '#3b82f6'
   - Default x,y: 540, 540

4. MOVE_OBJECT: { type: 'MOVE_OBJECT', id: string, dx: number, dy: number }
   - Use this if user says "move it right", "move down".
   - If ID is unknown, you can't really do this unless context is passed.

LOGIC RULES:
   - If the user asks for "knife", return ADD_TOOL with 'tool.knife'.
   - If the user asks for "blue circle", return ADD_SHAPE with { shape: 'circle', color: '#0000FF' }.
   - If the user asks for "headline saying Sale", return ADD_TEXT with { content: "Sale", style: { fontSize: 80, fontWeight: 'bold' } }.
   - Return ONLY a raw JSON array of commands. No markdown.

EXAMPLE INPUT: "Add a red star in the corner"
EXAMPLE OUTPUT:
[
  { "type": "ADD_SHAPE", "shape": "star", "x": 100, "y": 100, "color": "#FF0000" }
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

        let rawCommands = JSON.parse(text);

        if (!Array.isArray(rawCommands)) {
            throw new Error("AI did not return an array");
        }

        // Transform simplified AI commands to actual CanvasCommands
        const commands: CanvasCommand[] = rawCommands.map((cmd: any) => {
            if (cmd.type === 'ADD_SHAPE') {
                // Transform to ADD_OBJECT
                return {
                    type: 'ADD_OBJECT',
                    object: {
                        id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        type: 'shape',
                        pose: {
                            x: cmd.x || 540,
                            y: cmd.y || 540,
                            r: 0,
                            scaleX: 1,
                            scaleY: 1
                        },
                        content: cmd.shape,
                        style: {
                            fill: cmd.color || '#3b82f6',
                            width: 200,
                            height: 200,
                            radius: 100,
                            stroke: 'transparent',
                            strokeWidth: 0
                        },
                        locked: false,
                        metadata: {}
                    }
                };
            }
            return cmd;
        });

        return commands;

    } catch (e) {
        console.error("Copilot Error:", e);
        return [];
    }
}
