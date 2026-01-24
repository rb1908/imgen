'use client';

import { useSocialEditor } from '@/hooks/useSocialEditor';
import { SocialEditorTools } from './SocialEditorTools';
import { SocialEditorToolbar } from './SocialEditorToolbar';
import { SidebarPanels } from './editor/SidebarPanels';
import { TopToolbar } from './editor/TopToolbar';
import { SocialCanvas } from './editor/SocialCanvas';

interface SocialEditorProps {
    baseImage?: string;
    onSave?: (dataUrl: string) => void;
    isSaving?: boolean;
}

export function SocialEditor({ baseImage, onSave, isSaving }: SocialEditorProps) {
    const {
        scene, selectedId, setSelectedId,
        zoom, setZoom, pan, setPan,
        activeTool, setActiveTool,
        panningMode, guides,
        safeAreaVisible, snapEnabled,
        historyPast, historyFuture, undo, redo,
        stageRef, trRef,
        handleWheel,
        handleStageDragEnd,
        handleObjectDragMove,
        handleObjectDragEnd,
        handleTransformEnd
    } = useSocialEditor(baseImage);

    const handleSave = () => {
        if (stageRef.current && onSave) {
            setSelectedId(null);
            setTimeout(() => {
                const oldScale = stageRef.current.scaleX();
                const oldPos = stageRef.current.position();

                stageRef.current.scale({ x: 1, y: 1 });
                stageRef.current.position({ x: 0, y: 0 });

                const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });

                stageRef.current.scale({ x: oldScale, y: oldScale });
                stageRef.current.position(oldPos);

                onSave(dataUrl);
            }, 50);
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-neutral-950 text-white">

            {/* Left Toolbar - Dark */}
            <div className="border-r border-neutral-800 bg-neutral-900 z-30">
                <SocialEditorTools activeTool={activeTool} onToolSelect={setActiveTool} />
            </div>

            {/* Side Panel (Contextual) */}
            <SidebarPanels activeTool={activeTool} />

            {/* Middle: Canvas Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col bg-neutral-950">

                {/* Top Bar Actions */}
                <TopToolbar
                    undo={undo}
                    redo={redo}
                    canUndo={historyPast.length > 0}
                    canRedo={historyFuture.length > 0}
                    zoom={zoom}
                    setZoom={setZoom}
                    sceneWidth={scene.width}
                    sceneHeight={scene.height}
                    onSave={handleSave}
                    isSaving={!!isSaving}
                />

                {/* Property Toolbar (Dynamic) */}
                <SocialEditorToolbar />

                {/* Infinite Canvas */}
                <SocialCanvas
                    stageRef={stageRef}
                    trRef={trRef}
                    scene={scene}
                    zoom={zoom}
                    pan={pan}
                    panningMode={panningMode}
                    activeTool={activeTool}
                    handlers={{
                        handleWheel,
                        handleStageDragEnd,
                        handleObjectDragMove,
                        handleObjectDragEnd,
                        handleTransformEnd,
                        setSelectedId,
                        setActiveTool
                    }}
                    guides={guides}
                    safeAreaVisible={safeAreaVisible}
                />
            </div>
        </div >
    );
}
