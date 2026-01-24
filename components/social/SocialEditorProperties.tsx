'use client';

import { useCanvasStore } from '@/lib/engine/store';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, MoveUp, MoveDown, Copy, AlignLeft, AlignCenter, AlignRight, RotateCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AICopilotPanel } from './AICopilotPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { FontPicker } from './FontPicker';

const COLORS = [
    '#000000', '#FFFFFF', '#6B7280', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'
];

export function SocialEditorProperties() {
    const { scene, selectedId, dispatch, setSelectedId } = useCanvasStore();

    const selectedObject = selectedId ? scene.objects.find(o => o.id === selectedId) : null;

    if (!selectedObject) {
        return <AICopilotPanel />;
    }

    const updateStyle = (key: string, value: any) => {
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

    const updatePose = (key: string, value: number) => {
        dispatch({
            type: 'SET_POSE',
            id: selectedObject.id,
            ...selectedObject.pose,
            [key]: value
        });
    };

    const handleDelete = () => {
        dispatch({ type: 'DELETE_ENTITY', id: selectedObject.id });
        setSelectedId(null);
    };

    return (
        <div className="w-80 border-l border-neutral-800 bg-neutral-900 text-white flex flex-col h-full">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wide">
                        {selectedObject.type} Properties
                    </h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-400 hover:text-white" onClick={() => setSelectedId(null)}>
                    <span className="sr-only">Close</span>
                    ×
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* --- Transform Properties --- */}
                <div className="space-y-4">
                    <Label className="text-xs font-semibold text-neutral-500 uppercase">Transform</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-400">Position X</Label>
                            <Input
                                type="number"
                                className="h-8 bg-neutral-800 border-neutral-700 text-xs"
                                value={Math.round(selectedObject.pose.x)}
                                onChange={(e) => updatePose('x', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-400">Position Y</Label>
                            <Input
                                type="number"
                                className="h-8 bg-neutral-800 border-neutral-700 text-xs"
                                value={Math.round(selectedObject.pose.y)}
                                onChange={(e) => updatePose('y', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-400">Rotation</Label>
                            <div className="flex items-center gap-2">
                                <RotateCw className="w-3 h-3 text-neutral-500" />
                                <Input
                                    type="number"
                                    className="h-8 bg-neutral-800 border-neutral-700 text-xs"
                                    value={Math.round(selectedObject.pose.r)}
                                    onChange={(e) => updatePose('r', Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-neutral-400">Scale</Label>
                            <Input
                                type="number"
                                step="0.1"
                                className="h-8 bg-neutral-800 border-neutral-700 text-xs"
                                value={selectedObject.pose.scaleX.toFixed(2)}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    dispatch({
                                        type: 'SET_POSE',
                                        id: selectedObject.id,
                                        ...selectedObject.pose,
                                        scaleX: val,
                                        scaleY: val
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-neutral-800" />

                {/* --- TEXT Properties --- */}
                {selectedObject.type === 'text' && (
                    <div className="space-y-4">
                        <Label className="text-xs font-semibold text-neutral-500 uppercase">Typography</Label>
                        <div className="space-y-3">
                            <FontPicker
                                value={selectedObject.style?.fontFamily || 'Inter'}
                                onChange={(v) => updateStyle('fontFamily', v)}
                            />

                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    className="h-9 bg-neutral-800 border-neutral-700 w-20"
                                    value={selectedObject.style?.fontSize || 24}
                                    onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
                                />
                                <div className="flex bg-neutral-800 rounded border border-neutral-700 p-1 flex-1">
                                    {['left', 'center', 'right'].map((align) => (
                                        <Button
                                            key={align}
                                            variant="ghost"
                                            size="sm"
                                            className={`flex-1 h-6 px-0 ${selectedObject.style?.align === align ? 'bg-neutral-600 text-white' : 'text-neutral-400'}`}
                                            onClick={() => updateStyle('align', align)}
                                        >
                                            {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                            {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                            {align === 'right' && <AlignRight className="w-4 h-4" />}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`flex-1 h-8 bg-neutral-800 border-neutral-700 ${selectedObject.style?.fontStyle === 'bold' ? 'bg-indigo-600 border-indigo-500' : ''}`}
                                    onClick={() => updateStyle('fontStyle', selectedObject.style?.fontStyle === 'bold' ? 'normal' : 'bold')}
                                >
                                    <span className="font-bold">B</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`flex-1 h-8 bg-neutral-800 border-neutral-700 ${selectedObject.style?.fontStyle === 'italic' ? 'bg-indigo-600 border-indigo-500' : ''}`}
                                    onClick={() => updateStyle('fontStyle', selectedObject.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
                                >
                                    <span className="italic">I</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`flex-1 h-8 bg-neutral-800 border-neutral-700 ${selectedObject.style?.textDecoration === 'underline' ? 'bg-indigo-600 border-indigo-500' : ''}`}
                                    onClick={() => updateStyle('textDecoration', selectedObject.style?.textDecoration === 'underline' ? '' : 'underline')}
                                >
                                    <span className="underline">U</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Appearance (Color/Stroke) for Text & Shapes --- */}
                {(selectedObject.type === 'text' || selectedObject.type === 'shape') && (
                    <div className="space-y-4">
                        <Label className="text-xs font-semibold text-neutral-500 uppercase">Appearance</Label>

                        {/* Fill Color */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs text-neutral-400">Fill Color</Label>
                                <div className="h-4 w-4 rounded-full border border-neutral-700" style={{ backgroundColor: selectedObject.style?.fill || 'transparent' }} />
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded-full border border-transparent hover:scale-110 transition-transform ${selectedObject.style?.fill === c ? 'ring-2 ring-white border-neutral-900' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => updateStyle('fill', c)}
                                    />
                                ))}
                                <div className="col-span-6 mt-1">
                                    <Input
                                        type="text"
                                        value={selectedObject.style?.fill || ''}
                                        className="h-8 bg-neutral-800 border-neutral-700 text-xs font-mono"
                                        placeholder="#HEX"
                                        onChange={(e) => updateStyle('fill', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-neutral-800" />

                        {/* Stroke/Border */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs text-neutral-400">Stroke / Border</Label>
                                {selectedObject.style?.stroke && selectedObject.style?.stroke !== 'transparent' && (
                                    <div className="h-4 w-4 rounded-full border border-neutral-700" style={{ backgroundColor: selectedObject.style?.stroke }} />
                                )}
                            </div>

                            <div className="grid grid-cols-6 gap-2">
                                <button
                                    className={`w-6 h-6 rounded flex items-center justify-center border border-neutral-700 hover:bg-neutral-800 ${!selectedObject.style?.stroke || selectedObject.style?.stroke === 'transparent' ? 'bg-neutral-800 ring-2 ring-white' : ''}`}
                                    onClick={() => updateStyle('stroke', 'transparent')}
                                    title="No Stroke"
                                >
                                    <div className="w-0.5 h-full bg-red-400 rotate-45" />
                                </button>
                                {COLORS.map(c => (
                                    <button
                                        key={c + '_stroke'}
                                        className={`w-6 h-6 rounded-full border border-transparent hover:scale-110 transition-transform ${selectedObject.style?.stroke === c ? 'ring-2 ring-white border-neutral-900' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => updateStyle('stroke', c)}
                                    />
                                ))}
                            </div>

                            {selectedObject.style?.stroke && selectedObject.style?.stroke !== 'transparent' && (
                                <div className="pt-2">
                                    <div className="flex justify-between mb-1">
                                        <Label className="text-[10px] text-neutral-500">Thickness</Label>
                                        <span className="text-[10px] text-neutral-500">{selectedObject.style?.strokeWidth || 1}px</span>
                                    </div>
                                    <Slider
                                        min={1} max={20} step={1}
                                        value={[selectedObject.style?.strokeWidth || 1]}
                                        onValueChange={(v) => updateStyle('strokeWidth', v[0])}
                                    />
                                </div>
                            )}
                        </div>

                    </div>
                )}

                <div className="h-px bg-neutral-800" />

                {/* --- Common Opacity --- */}
                <div className="space-y-3">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs font-semibold text-neutral-500 uppercase">Opacity</Label>
                        <span className="text-xs text-neutral-400">{Math.round((selectedObject.style?.opacity ?? 1) * 100)}%</span>
                    </div>
                    <Slider
                        min={0} max={1} step={0.01}
                        value={[selectedObject.style?.opacity ?? 1]}
                        onValueChange={(v) => updateStyle('opacity', v[0])}
                    />
                </div>

            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-900">
                <Button variant="destructive" className="w-full text-xs" onClick={handleDelete}>
                    <Trash2 className="w-3 h-3 mr-2" /> Delete Layer
                </Button>
            </div>
        </div>
    );
}
