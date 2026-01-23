import { CanvasObject, Scene, Zone } from './sceneSchema';
import { validateSceneBounds, validateUniqueId, validateZone } from './validators';
import { createToolObject } from './toolRegistry';

// Discriminated Union of Commands
export type CanvasCommand =
    | { type: 'ADD_OBJECT'; object: CanvasObject }
    | { type: 'UPDATE_OBJECT'; id: string; patch: Partial<CanvasObject> }
    | { type: 'MOVE_OBJECT'; id: string; dx: number; dy: number }
    | { type: 'SET_POSE'; id: string; x: number; y: number; r?: number; scaleX?: number; scaleY?: number }
    | { type: 'DELETE_ENTITY'; id: string }
    | { type: 'ADD_ZONE'; zone: Zone }
    | { type: 'ADD_ZONE'; zone: Zone }
    | { type: 'ADD_TOOL'; toolType: string; x: number; y: number }
    | { type: 'ADD_TEXT'; content: string; x: number; y: number; style?: string }
    | { type: 'ADD_IMAGE'; url: string; x: number; y: number }
    | { type: 'REORDER_OBJECTS'; newOrder: string[] };

export interface CommandResult {
    scene: Scene;
    event?: string;
}

export function applyCommand(currentScene: Scene, command: CanvasCommand): CommandResult {
    // Deep clone to avoid mutation side effects (in a real app, use Immer)
    let nextScene = JSON.parse(JSON.stringify(currentScene)) as Scene;

    switch (command.type) {
        case 'ADD_OBJECT':
            validateUniqueId(command.object.id, nextScene);
            validateSceneBounds(command.object, nextScene);
            nextScene.objects.push(command.object);
            return { scene: nextScene, event: `Added ${command.object.id}` };

        case 'ADD_TOOL':
            const tool = createToolObject(command.toolType, command.x, command.y);
            validateUniqueId(tool.id, nextScene);
            validateSceneBounds(tool, nextScene);
            nextScene.objects.push(tool);
            return { scene: nextScene, event: `Added Tool ${tool.metadata.toolType}` };

        case 'ADD_TEXT':
            const textId = `text_${Date.now()}`;
            nextScene.objects.push({
                id: textId,
                type: 'text',
                pose: { x: command.x, y: command.y, r: 0, scaleX: 1, scaleY: 1 },
                content: command.content,
                style: { fontSize: 40, fill: 'white', fontFamily: 'Inter' },
                locked: false,
                metadata: {}
            });
            return { scene: nextScene, event: 'Added Text' };

        case 'ADD_IMAGE':
            const imgId = `img_${Date.now()}`;
            nextScene.objects.push({
                id: imgId,
                type: 'image',
                pose: { x: command.x, y: command.y, r: 0, scaleX: 1, scaleY: 1 },
                content: command.url,
                style: { width: 150, height: 150 },
                locked: false,
                metadata: {}
            });
            return { scene: nextScene, event: 'Added Image' };

        case 'UPDATE_OBJECT':
            const objIndex = nextScene.objects.findIndex(o => o.id === command.id);
            if (objIndex === -1) throw new Error(`Object ${command.id} not found`);

            nextScene.objects[objIndex] = {
                ...nextScene.objects[objIndex],
                ...command.patch,
                pose: { ...nextScene.objects[objIndex].pose, ...(command.patch.pose || {}) }
            };
            return { scene: nextScene, event: `Updated ${command.id}` };

        case 'MOVE_OBJECT':
            const mvIndex = nextScene.objects.findIndex(o => o.id === command.id);
            if (mvIndex === -1) throw new Error(`Object ${command.id} not found`);

            const obj = nextScene.objects[mvIndex];
            obj.pose.x += command.dx;
            obj.pose.y += command.dy;
            validateSceneBounds(obj, nextScene);
            return { scene: nextScene, event: `Moved ${command.id}` };

        case 'SET_POSE':
            const poseIndex = nextScene.objects.findIndex(o => o.id === command.id);
            if (poseIndex === -1) throw new Error(`Object ${command.id} not found`);

            const target = nextScene.objects[poseIndex];
            target.pose.x = command.x;
            target.pose.y = command.y;
            if (command.r !== undefined) target.pose.r = command.r;
            if (command.scaleX !== undefined) target.pose.scaleX = command.scaleX;
            if (command.scaleY !== undefined) target.pose.scaleY = command.scaleY;

            validateSceneBounds(target, nextScene);
            return { scene: nextScene, event: `Posed ${command.id}` };

        case 'DELETE_ENTITY':
            const initialLen = nextScene.objects.length + nextScene.zones.length;
            nextScene.objects = nextScene.objects.filter(o => o.id !== command.id);
            nextScene.zones = nextScene.zones.filter(z => z.id !== command.id);

            if (nextScene.objects.length + nextScene.zones.length === initialLen) {
                throw new Error(`Entity ${command.id} not found to delete`);
            }
            return { scene: nextScene, event: `Deleted ${command.id}` };

        case 'ADD_ZONE':
            validateUniqueId(command.zone.id, nextScene);
            validateZone(command.zone);
            nextScene.zones.push(command.zone);
            return { scene: nextScene, event: `Added Zone ${command.zone.id}` };

        case 'REORDER_OBJECTS':
            //Create a map for quick lookup
            const objMap = new Map(nextScene.objects.map(o => [o.id, o]));
            const newObjects: CanvasObject[] = [];

            // Add objects based on newOrder
            for (const id of command.newOrder) {
                const obj = objMap.get(id);
                if (obj) {
                    newObjects.push(obj);
                    objMap.delete(id);
                }
            }

            // If any objects were missing from newOrder, append them (or decide to error)
            // Ideally newOrder is comprehensive. If not, we keep untracked objects at the end?
            // Let's assume comprehensive for now, or append remaining.
            for (const [_, obj] of objMap) {
                newObjects.push(obj);
            }

            nextScene.objects = newObjects;
            return { scene: nextScene, event: 'Reordered Layers' };

        default:
            return { scene: nextScene };
    }
}

export function applyCommands(currentScene: Scene, commands: CanvasCommand[]): CommandResult {
    let scene = currentScene;
    const events: string[] = [];

    for (const cmd of commands) {
        const result = applyCommand(scene, cmd);
        scene = result.scene;
        if (result.event) events.push(result.event);
    }

    return { scene, event: events.join(', ') };
}
