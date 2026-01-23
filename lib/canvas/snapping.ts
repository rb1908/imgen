export type SnapGuide = {
    vertical: boolean;
    position: number;
    diff: number;
    snap: 'start' | 'center' | 'end';
};

export type GuideLine = {
    type: 'horizontal' | 'vertical';
    position: number;
    pixelPosition: number; // For React-Konva line rendering
};

// Config
const GUIDELINE_OFFSET = 5; // Snap distance

export function getSnapGuides(
    target: { x: number; y: number; width: number; height: number; rotation: number },
    others: { x: number; y: number; width: number; height: number; rotation: number }[],
    stageWidth: number,
    stageHeight: number
) {
    // Simplified snapping: Only Center X/Y and Stage Edges for now
    // Advanced snapping checks against all other objects edges.

    const guides: GuideLine[] = [];
    let snapX: number | null = null;
    let snapY: number | null = null;

    // Center X Snap (Stage)
    const stageCenterX = stageWidth / 2;
    if (Math.abs(target.x - stageCenterX) < GUIDELINE_OFFSET) {
        snapX = stageCenterX;
        guides.push({ type: 'vertical', position: stageCenterX, pixelPosition: stageCenterX });
    }

    // Center Y Snap (Stage)
    const stageCenterY = stageHeight / 2;
    if (Math.abs(target.y - stageCenterY) < GUIDELINE_OFFSET) {
        snapY = stageCenterY;
        guides.push({ type: 'horizontal', position: stageCenterY, pixelPosition: stageCenterY });
    }

    return { snapX, snapY, guides };
}
