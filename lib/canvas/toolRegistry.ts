import { nanoid } from 'nanoid';
import { CanvasObject } from './sceneSchema';

// Tool Registry for "AI Tools" (Objects that have semantic meaning)

export const TOOL_TYPES = {
    KNIFE: 'tool.knife',
    SPATULA: 'tool.spatula',
    BRUSH: 'tool.brush',
    CUTTING_BOARD: 'board.cuttingBoard',
} as const;

export function createToolObject(type: string, x: number, y: number): CanvasObject {
    const id = `${type.replace('.', '_')}_${nanoid(6)}`;

    // MOCK: In a real app, these would load specific SVG assets or images
    let content = '';
    let style = {};

    switch (type) {
        case TOOL_TYPES.KNIFE:
            // TODO: Replace with real SVG/PNG in public/assets/
            content = 'https://cdn-icons-png.flaticon.com/512/3209/3209931.png';
            style = { width: 50, height: 200 };
            break;
        case TOOL_TYPES.CUTTING_BOARD:
            content = 'https://cdn-icons-png.flaticon.com/512/2917/2917633.png';
            style = { width: 300, height: 200, color: '#e5d0b1' };
            break;
        case TOOL_TYPES.SPATULA:
            content = 'https://cdn-icons-png.flaticon.com/512/1830/1830839.png';
            style = { width: 60, height: 250 };
            break;
        default:
            content = 'https://cdn-icons-png.flaticon.com/512/1000/1000997.png'; // Generic tool
    }

    return {
        id,
        type: 'tool', // Generic type in schema, specific type in metadata
        pose: { x, y, r: 0, scaleX: 1, scaleY: 1 },
        content,
        style,
        metadata: {
            toolType: type,
        },
        locked: false,
    };
}
