import { Button } from '@/components/ui/button';
import { Undo, Redo, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface TopToolbarProps {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    zoom: number;
    setZoom: (z: number) => void;
    sceneWidth: number;
    sceneHeight: number;
    onSave: () => void;
    isSaving: boolean;
}

export function TopToolbar({
    undo, redo, canUndo, canRedo,
    zoom, setZoom,
    sceneWidth, sceneHeight,
    onSave, isSaving
}: TopToolbarProps) {
    return (
        <div className="h-14 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-4 z-20 shadow-sm">
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="hover:bg-neutral-800 text-neutral-400 hover:text-white" onClick={undo} disabled={!canUndo}>
                    <Undo className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-neutral-800 text-neutral-400 hover:text-white" onClick={redo} disabled={!canRedo}>
                    <Redo className="w-4 h-4" />
                </Button>
            </div>

            <div className="font-mono text-xs text-neutral-500 flex items-center gap-4">
                <span>{sceneWidth} x {sceneHeight}</span>
                <span>{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-neutral-400 hover:text-white" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-neutral-400 hover:text-white" onClick={() => setZoom(Math.min(5, zoom + 0.1))}>
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-neutral-800 mx-2" />
                <Button size="sm" className="bg-white text-black hover:bg-neutral-200" onClick={onSave} disabled={isSaving}>
                    <Check className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    );
}
