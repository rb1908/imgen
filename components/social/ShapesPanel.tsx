'use client';

import { useCanvasStore } from '@/lib/engine/store';
import { Button } from '@/components/ui/button';
import { Square, Circle, Triangle, Star } from 'lucide-react';

export function ShapesPanel() {
    const { dispatch } = useCanvasStore();

    const addShape = (shapeType: string) => {
        const id = `shape_${Date.now()}`;
        const center = 540; // Default center for new objects

        dispatch({
            type: 'ADD_OBJECT',
            object: {
                id,
                type: 'shape',
                pose: { x: center, y: center, r: 0, scaleX: 1, scaleY: 1 },
                content: shapeType, // 'rect', 'circle', 'triangle', 'star'
                style: {
                    fill: '#3b82f6', // Default blue
                    width: 200,
                    height: 200,
                    radius: 100, // for circle
                },
                locked: false,
                metadata: {}
            }
        });
    };

    return (
        <div className="h-full flex flex-col p-4">
            <h3 className="font-semibold text-white mb-4">Shapes</h3>
            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 text-neutral-300"
                    onClick={() => addShape('rect')}
                >
                    <Square className="w-8 h-8" />
                    <span className="text-xs">Square</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 text-neutral-300"
                    onClick={() => addShape('circle')}
                >
                    <Circle className="w-8 h-8" />
                    <span className="text-xs">Circle</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 text-neutral-300"
                    onClick={() => addShape('triangle')}
                >
                    <Triangle className="w-8 h-8" />
                    <span className="text-xs">Triangle</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 text-neutral-300"
                    onClick={() => addShape('star')}
                >
                    <Star className="w-8 h-8" />
                    <span className="text-xs">Star</span>
                </Button>
            </div>
        </div>
    );
}
