'use client';

import { useCanvasStore } from '@/lib/canvas/store';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Trash2, MoveUp, MoveDown, Copy, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AICopilotPanel } from './AICopilotPanel';

const FONTS = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Playfair Display', label: 'Playfair' },
    { value: 'Roboto Mono', label: 'Mono' },
    { value: 'Lobster', label: 'Cursive' },
    { value: 'Bebas Neue', label: 'Bold' },
];

const COLORS = [
    '#000000', '#FFFFFF', '#FF5733', '#33FF57', '#3357FF', '#F1C40F'
];

export function SocialEditorProperties() {
    const { scene, selectedId, dispatch, setSelectedId } = useCanvasStore();

    const selectedObject = selectedId ? scene.objects.find(o => o.id === selectedId) : null;

    if (!selectedObject) {
        // Show AI Copilot when nothing selected
        return <AICopilotPanel />;
    }

    const updateProp = (key: string, value: any) => {
        // Special mapping for props that live in 'style' vs root
        // Text 'fontSize' typically needs to be in style or root depending on our schema.
        // Schema has 'style' bag. Let's put everything visual there if possible, or update specific fields if schema allows.
        // Assuming Konva object rendering reads from 'style' or root props.
        // Our SocialEditor currently reads: fontSize={24} hardcoded... wait, we need to fix SocialEditor rendering to read style!

        // Let's assume we will update SocialEditor to read style properties.
        dispatch({
            type: 'UPDATE_OBJECT',
            id: selectedObject.id,
            patch: {
                style: {
                    ...selectedObject.style,
                    [key]: value
                }
            }
        });
    };

    const updateRoot = (key: string, value: any) => {
        dispatch({
            type: 'UPDATE_OBJECT',
            id: selectedObject.id,
            patch: { [key]: value }
        });
    };

    const handleDelete = () => {
        dispatch({ type: 'DELETE_ENTITY', id: selectedObject.id });
        setSelectedId(null);
    };

    return (
        <div className="w-80 border-l border-neutral-800 bg-neutral-900 text-white flex flex-col h-full">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                    Edit {selectedObject.type}
                </h3>
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white" onClick={() => setSelectedId(null)}>
                    <span className="sr-only">Close</span>
                    ×
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Text Properties */}
                {selectedObject.type === 'text' && (
                    <>
                        <div className="space-y-3">
                            <Label>Font</Label>
                            <Select
                                value={selectedObject.style?.fontFamily || 'Inter'}
                                onValueChange={(v) => updateProp('fontFamily', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONTS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label>Color</Label>
                                <div className="h-4 w-4 rounded-full border shadow-sm" style={{ backgroundColor: selectedObject.style?.fill || 'black' }} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded-full border ${selectedObject.style?.fill === c ? 'ring-2 ring-primary' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => updateProp('fill', c)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Size ({selectedObject.style?.fontSize || 24}px)</Label>
                            <Slider
                                min={12} max={120} step={1}
                                value={[selectedObject.style?.fontSize || 24]}
                                onValueChange={(v: number[]) => updateProp('fontSize', v[0])}
                            />
                        </div>
                    </>
                )}

                {/* Common Properties */}
                <div className="space-y-3">
                    <Label>Opacity</Label>
                    <Slider
                        min={0} max={1} step={0.1}
                        value={[selectedObject.style?.opacity ?? 1]}
                        onValueChange={(v: number[]) => updateProp('opacity', v[0])}
                    />
                </div>

                <div className="space-y-3">
                    <Label>Layering</Label>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => dispatch({ type: 'MOVE_OBJECT', id: selectedObject.id, dx: 0, dy: 0 }, 'human')}>
                            <MoveUp className="w-4 h-4 mr-2" /> Bring Fwd
                        </Button>
                        {/* To implement real layering we need REORDER_OBJECT command. For now just placeholder */}
                    </div>
                </div>

            </div>

            <div className="p-4 border-t bg-muted/10">
                <Button variant="destructive" className="w-full" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Object
                </Button>
            </div>
        </div>
    );
}
