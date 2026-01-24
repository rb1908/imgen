'use client';

import { useCanvasStore } from '@/lib/canvas/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Trash2,
    Copy,
    Layers,
    Type,
    Move,
    Palette
} from 'lucide-react';
import { FontPicker } from './FontPicker';

const COLORS = [
    '#000000', '#FFFFFF', '#6B7280', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', 'transparent'
];

export function SocialEditorToolbar() {
    const { scene, selectedId, dispatch, setSelectedId } = useCanvasStore();
    const selectedObject = selectedId ? scene.objects.find(o => o.id === selectedId) : null;

    if (!selectedObject) {
        return (
            <div className="h-12 border-b border-neutral-800 bg-neutral-900 flex items-center px-4 text-xs text-neutral-500">
                Select an object to edit properties
            </div>
        );
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

    const handleDuplicate = () => {
        // Basic duplicate logic: create copy with offset
        const newId = `${selectedObject.type}_${Date.now()}`;
        dispatch({
            type: 'ADD_OBJECT',
            object: {
                ...selectedObject,
                id: newId,
                pose: {
                    ...selectedObject.pose,
                    x: selectedObject.pose.x + 20,
                    y: selectedObject.pose.y + 20
                }
            }
        });
        setSelectedId(newId);
    };

    return (
        <div className="h-14 border-b border-neutral-200 bg-white flex items-center px-4 gap-3 overflow-x-auto no-scrollbar text-neutral-900">

            {/* --- Typography (Text Only) --- */}
            {selectedObject.type === 'text' && (
                <>
                    <div className="w-[180px] shrink-0">
                        <FontPicker
                            value={selectedObject.style?.fontFamily || 'Inter'}
                            onChange={(v) => updateStyle('fontFamily', v)}
                        />
                    </div>

                    <div className="flex items-center border border-neutral-200 rounded-md overflow-hidden bg-white h-9 shrink-0 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-full w-8 rounded-none hover:bg-neutral-100 text-neutral-700" onClick={() => updateStyle('fontSize', (selectedObject.style?.fontSize || 24) - 1)}>-</Button>
                        <Input
                            className="w-12 h-full text-center border-0 bg-transparent focus-visible:ring-0 px-0 text-xs text-neutral-900"
                            value={selectedObject.style?.fontSize || 24}
                            onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
                        />
                        <Button variant="ghost" size="icon" className="h-full w-8 rounded-none hover:bg-neutral-100 text-neutral-700" onClick={() => updateStyle('fontSize', (selectedObject.style?.fontSize || 24) + 1)}>+</Button>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-neutral-200 h-9 shrink-0 shadow-sm">
                        <Button
                            variant="ghost" size="icon" className={`h-7 w-7 ${selectedObject.style?.fontStyle === 'bold' ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-900'}`}
                            onClick={() => updateStyle('fontStyle', selectedObject.style?.fontStyle === 'bold' ? 'normal' : 'bold')}
                        >
                            <Bold className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost" size="icon" className={`h-7 w-7 ${selectedObject.style?.fontStyle === 'italic' ? 'bg-neutral-100 text-neutral-900 italic' : 'text-neutral-500 hover:text-neutral-900'}`}
                            onClick={() => updateStyle('fontStyle', selectedObject.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
                        >
                            <Italic className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost" size="icon" className={`h-7 w-7 ${selectedObject.style?.textDecoration === 'underline' ? 'bg-neutral-100 text-neutral-900 underline' : 'text-neutral-500 hover:text-neutral-900'}`}
                            onClick={() => updateStyle('textDecoration', selectedObject.style?.textDecoration === 'underline' ? '' : 'underline')}
                        >
                            <Underline className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-neutral-200 h-9 shrink-0 shadow-sm">
                        {['left', 'center', 'right'].map((align) => (
                            <Button
                                key={align}
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 ${selectedObject.style?.align === align ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
                                onClick={() => updateStyle('align', align)}
                            >
                                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                {align === 'right' && <AlignRight className="w-4 h-4" />}
                            </Button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-neutral-200 mx-1 shrink-0" />
                </>
            )}


            {/* --- Color (Fill) --- */}
            {(selectedObject.type === 'text' || selectedObject.type === 'shape') && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 w-12 p-0 border-neutral-200 bg-white shadow-sm relative overflow-hidden shrink-0 hover:bg-neutral-50">
                            <div className="absolute inset-0" style={{ backgroundColor: selectedObject.style?.fill || '#000000' }} />
                            <span className="sr-only">Color</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 bg-white border-neutral-200 text-neutral-900 shadow-md">
                        <div className="space-y-3">
                            <h4 className="text-xs font-medium text-neutral-500 uppercase">Fill Color</h4>
                            <div className="grid grid-cols-6 gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded-full border border-neutral-200 ${c === 'transparent' ? 'bg-white' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => updateStyle('fill', c)}
                                    >
                                        {c === 'transparent' && <div className="w-full h-0.5 bg-red-500 rotate-45 transform origin-center translate-y-2.5" />}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500">Hex</span>
                                <Input
                                    className="h-7 text-xs bg-white border-neutral-200 text-neutral-900"
                                    value={selectedObject.style?.fill || ''}
                                    onChange={(e) => updateStyle('fill', e.target.value)}
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {/* --- Stroke (Shape Only) --- */}
            {selectedObject.type === 'shape' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 gap-2 border-neutral-200 bg-white text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 shadow-sm text-xs shrink-0">
                            <div className="w-4 h-4 border-2 border-current rounded-sm" style={{ color: selectedObject.style?.stroke || 'transparent' }} />
                            Border
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 bg-white border-neutral-200 text-neutral-900 shadow-md">
                        <div className="space-y-3">
                            <h4 className="text-xs font-medium text-neutral-500 uppercase">Border Color</h4>
                            <div className="grid grid-cols-6 gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c + '_stroke'}
                                        className={`w-6 h-6 rounded-full border border-neutral-200 ${c === 'transparent' ? 'bg-white' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => updateStyle('stroke', c)}
                                    >
                                        {c === 'transparent' && <div className="w-full h-0.5 bg-red-500 rotate-45 transform origin-center translate-y-2.5" />}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-neutral-500">Thickness</span>
                                    <span className="text-xs text-neutral-400">{selectedObject.style?.strokeWidth || 0}px</span>
                                </div>
                                <Slider
                                    min={0} max={20} step={1}
                                    value={[selectedObject.style?.strokeWidth || 0]}
                                    onValueChange={(v) => updateStyle('strokeWidth', v[0])}
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {/* --- Opacity --- */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 shrink-0">
                        <Palette className="w-4 h-4 opacity-75" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3 bg-white border-neutral-200 shadow-md">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs text-neutral-500">Opacity</span>
                            <span className="text-xs text-neutral-400">{Math.round((selectedObject.style?.opacity ?? 1) * 100)}%</span>
                        </div>
                        <Slider
                            min={0} max={1} step={0.01}
                            value={[selectedObject.style?.opacity ?? 1]}
                            onValueChange={(v) => updateStyle('opacity', v[0])}
                        />
                    </div>
                </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-neutral-200 mx-1 shrink-0" />

            {/* --- Position & Layering --- */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-9 gap-2 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 shrink-0">
                        <Move className="w-3 h-3" />
                        Position
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 bg-white border-neutral-200 shadow-md">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[10px] text-neutral-500 uppercase">X</span>
                            <Input
                                type="number"
                                className="h-7 text-xs bg-white border-neutral-200 text-neutral-900"
                                value={Math.round(selectedObject.pose.x)}
                                onChange={(e) => updatePose('x', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-neutral-500 uppercase">Y</span>
                            <Input
                                type="number"
                                className="h-7 text-xs bg-white border-neutral-200 text-neutral-900"
                                value={Math.round(selectedObject.pose.y)}
                                onChange={(e) => updatePose('y', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-neutral-500 uppercase">Rotation</span>
                            <Input
                                type="number"
                                className="h-7 text-xs bg-white border-neutral-200 text-neutral-900"
                                value={Math.round(selectedObject.pose.r)}
                                onChange={(e) => updatePose('r', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-neutral-500 uppercase">Scale</span>
                            <Input
                                type="number" step="0.1"
                                className="h-7 text-xs bg-white border-neutral-200 text-neutral-900"
                                value={selectedObject.pose.scaleX.toFixed(2)}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    dispatch({ type: 'SET_POSE', id: selectedObject.id, ...selectedObject.pose, scaleX: val, scaleY: val });
                                }}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <div className="flex-1" /> {/* Spacer */}

            {/* --- Actions --- */}
            <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 shrink-0" onClick={handleDuplicate} title="Duplicate">
                <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-500 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={handleDelete} title="Delete">
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
}
