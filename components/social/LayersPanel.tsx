'use client';

import { useCanvasStore } from '@/lib/engine/store';
import { Reorder } from 'framer-motion';
import { Eye, EyeOff, GripVertical, Lock, Unlock, Image as ImageIcon, Type, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LayersPanel() {
    const { scene, selectedId, setSelectedId, dispatch } = useCanvasStore();

    // The scene.objects array is in Render Order (0 = Bottom, N = Top).
    // Layers Panel usually shows Top = Top.
    // So we reversed it for display, but we must handle the index mapping correctly.
    // Actually, Reorder.Group works best if we give it the array in the order we want to display.
    // If we want "Top Layer" at the top of the list, we need the array to be [Top, ..., Bottom].
    // This equals [...objects].reverse().

    // When we reorder this reversed array, we get a NEW reversed array.
    // We must REVERSE it again to get the new Render Order before dispatching.

    const displayLayers = [...scene.objects].reverse();

    const handleReorder = (newDisplayOrder: typeof displayLayers) => {
        // Convert back to Render Order (Bottom -> Top)
        const newRenderOrder = [...newDisplayOrder].reverse();
        const ids = newRenderOrder.map(o => o.id);
        dispatch({ type: 'REORDER_OBJECTS', newOrder: ids });
    };

    const toggleLock = (id: string, currentLocked: boolean) => {
        dispatch({ type: 'UPDATE_OBJECT', id, patch: { locked: !currentLocked } });
    };

    // Helper to get icon
    const getIcon = (type: string) => {
        switch (type) {
            case 'text': return <Type className="w-4 h-4" />;
            case 'image': return <ImageIcon className="w-4 h-4" />;
            case 'shape': return <Square className="w-4 h-4" />;
            default: return <Square className="w-4 h-4" />;
        }
    };

    if (scene.objects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-neutral-500 text-sm">
                <p>No layers yet</p>
                <p className="text-xs opacity-50">Add text or images</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
            <div className="h-10 border-b border-neutral-800 flex items-center px-4 font-medium text-xs text-neutral-400 uppercase tracking-wider">
                Layers
            </div>

            <ScrollArea className="flex-1">
                <Reorder.Group
                    axis="y"
                    values={displayLayers}
                    onReorder={handleReorder}
                    className="p-2 space-y-1"
                >
                    {displayLayers.map((obj) => (
                        <Reorder.Item
                            key={obj.id}
                            value={obj}
                            className={cn(
                                "group flex items-center gap-2 p-2 rounded-md border border-transparent cursor-default select-none transition-all",
                                selectedId === obj.id
                                    ? "bg-indigo-900/30 border-indigo-500/30 text-indigo-200"
                                    : "hover:bg-neutral-800 text-neutral-300"
                            )}
                            onClick={() => setSelectedId(obj.id)}
                        >
                            {/* Drag Handle */}
                            <div className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400 px-1" onPointerDown={(e) => e.preventDefault()}>
                                <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Icon */}
                            <div className="text-neutral-500">
                                {getIcon(obj.type)}
                            </div>

                            {/* Label */}
                            <div className="flex-1 min-w-0 text-sm truncate font-medium">
                                {obj.type === 'text' ? (typeof obj.content === 'string' ? obj.content : 'Text Layer') : (obj.type === 'image' ? (obj.metadata?.filename || 'Image Layer') : obj.id)}
                            </div>

                            {/* Actions (Lock) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleLock(obj.id, !!obj.locked); }}
                                className={cn(
                                    "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                                    obj.locked ? "opacity-100 text-amber-500" : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                {obj.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            {/* Visibility (Placeholder - need to add hidden prop to Schema first) */}
                            {/* <Eye className="w-3.5 h-3.5 text-neutral-500" /> */}

                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </ScrollArea>
        </div>
    );
}
