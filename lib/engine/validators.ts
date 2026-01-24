import { Scene, CanvasObject, Zone } from './sceneSchema';

export function validateSceneBounds(object: CanvasObject, scene: Scene) {
    // Simple center point check for now. 
    // Ideally we check bounding box but we need size info which might be dynamic.
    if (object.pose.x < 0 || object.pose.x > scene.width) {
        throw new Error(`Object ${object.id} X=${object.pose.x} is out of bounds (0-${scene.width})`);
    }
    if (object.pose.y < 0 || object.pose.y > scene.height) {
        throw new Error(`Object ${object.id} Y=${object.pose.y} is out of bounds (0-${scene.height})`);
    }
}

export function validateUniqueId(id: string, scene: Scene) {
    if (scene.objects.some(o => o.id === id) || scene.zones.some(z => z.id === id)) {
        throw new Error(`ID ${id} already exists in scene`);
    }
}

export function validateZone(zone: Zone) {
    if (zone.points.length < 6) { // x,y, x,y, x,y (min 3 points = 6 numbers)
        throw new Error(`Zone ${zone.id} must have at least 3 points`);
    }
}
