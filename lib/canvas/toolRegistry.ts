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
            content = 'https://placehold.co/100x400?text=Knife'; // Mock asset
            style = { width: 50, height: 200 };
            break;
        case TOOL_TYPES.CUTTING_BOARD:
            content = 'https://placehold.co/600x400?text=Board';
            style = { width: 300, height: 200, color: '#e5d0b1' };
            break;
        default:
            content = 'https://placehold.co/100x100?text=Tool';
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
