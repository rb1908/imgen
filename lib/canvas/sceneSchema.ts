import { z } from 'zod';

// Basic Types
export const PoseSchema = z.object({
    x: z.number(),
    y: z.number(),
    r: z.number().default(0), // Rotation in degrees
    scaleX: z.number().default(1),
    scaleY: z.number().default(1),
});

export type Pose = z.infer<typeof PoseSchema>;

// Object Base
export const CanvasObjectSchema = z.object({
    id: z.string(),
    type: z.enum(['text', 'image', 'shape', 'tool', 'sticker']),
    pose: PoseSchema,
    content: z.any().optional(), // Text content, Image URL, etc.
    style: z.any().optional(), // Color, font, shadow, specific preset ID
    metadata: z.record(z.string(), z.any()).default({}), // Extra data
    locked: z.boolean().default(false),
});

export type CanvasObject = z.infer<typeof CanvasObjectSchema>;

// Zone (Safety, Target, etc.)
export const ZoneSchema = z.object({
    id: z.string(),
    type: z.enum(['safe', 'danger', 'target']),
    points: z.array(z.number()), // [x1, y1, x2, y2, ...] - Polygon
    label: z.string().optional(),
});

export type Zone = z.infer<typeof ZoneSchema>;

// The Whole Scene
export const SceneSchema = z.object({
    width: z.number(),
    height: z.number(),
    backgroundUrl: z.string().optional(),
    objects: z.array(CanvasObjectSchema),
    zones: z.array(ZoneSchema).default([]),
});

export type Scene = z.infer<typeof SceneSchema>;

// Default Scene Factory
export function createDefaultScene(width = 1080, height = 1080): Scene {
    return {
        width,
        height,
        objects: [],
        zones: [],
    };
}
