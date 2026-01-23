'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Undo, Redo, Check, ZoomIn, ZoomOut, Hand } from 'lucide-react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Group } from 'react-konva';
import useImage from 'use-image';
import { useCanvasStore } from '@/lib/canvas/store';
import { SocialEditorTools } from './SocialEditorTools';
// ... imports
import { SocialEditorToolbar } from './SocialEditorToolbar';

// ... (SocialEditor fn)

return (
    <div className="flex h-full w-full overflow-hidden bg-neutral-950 text-white">

        {/* Left Toolbar - Dark */}
        <div className="border-r border-neutral-800 bg-neutral-900 z-30">
            <SocialEditorTools activeTool={activeTool} onToolSelect={setActiveTool} />
        </div>

        {/* Side Panel (Contextual) */}
        <AnimatePresence>
            {activeTool === 'layers' && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r border-neutral-800 bg-neutral-900 overflow-hidden z-20"
                >
                    <div className="w-[280px] h-full">
                        <LayersPanel />
                    </div>
                </motion.div>
            )}
            {activeTool === 'shapes' && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r border-neutral-800 bg-neutral-900 overflow-hidden z-20"
                >
                    <div className="w-[280px] h-full">
                        <ShapesPanel />
                    </div>
                </motion.div>
            )}
            {activeTool === 'text' && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r border-neutral-800 bg-neutral-900 overflow-hidden z-20"
                >
                    <div className="w-[280px] h-full">
                        <TextPresetsPanel />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Middle: Canvas Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-neutral-950">

            {/* Top Bar Actions */}
            <div className="h-14 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-4 z-20 shadow-sm">
                {/* ... (Existing top bar content - Undo/Redo/Save) ... */}
                {/* We might want to merge this with the Property Toolbar or stack them. Polotno has Header then Toolbar. */}
                {/* Let's keep the Header for global actions (Save/Download/Zoom) and put Toolbar below it. */}

                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-neutral-800 text-neutral-400 hover:text-white" onClick={undo} disabled={historyPast.length === 0}>
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-neutral-800 text-neutral-400 hover:text-white" onClick={redo} disabled={historyFuture.length === 0}>
                        <Redo className="w-4 h-4" />
                    </Button>
                </div>

                <div className="font-mono text-xs text-neutral-500 flex items-center gap-4">
                    <span>{scene.width} x {scene.height}</span>
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
                    <Button size="sm" className="bg-white text-black hover:bg-neutral-200" onClick={handleSave} disabled={isSaving}>
                        <Check className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            {/* Property Toolbar (Dynamic) */}
            <SocialEditorToolbar />

            {/* Infinite Canvas */}
            <div className="flex-1 relative cursor-dots bg-neutral-950/50" style={{ cursor: panningMode ? 'grab' : 'default' }}>
                <Stage
                    width={window.innerWidth - 380} // Approx responsive width
                    height={window.innerHeight - 120} // Adjusted for header + toolbar
                    scaleX={zoom}
                    scaleY={zoom}
                    x={pan.x}
                    y={pan.y}
                    draggable={panningMode} // Only drag stage if spacebar is held
                    onWheel={handleWheel}
                    onDragEnd={handleStageDragEnd}
                    ref={stageRef}
                    onMouseDown={(e) => {
                        if (e.target === e.target.getStage()) {
                            setSelectedId(null);
                        }
                    }}
                >
                    {/* ... (Stage content remains same) ... */}
                    <Layer>
                        {/* Canvas Background (The "Paper") */}
                        <KonvaRect
                            x={0} y={0}
                            width={1080} height={1080}
                            fill="white"
                            shadowColor="black"
                            shadowBlur={50}
                            shadowOpacity={0.5}
                        />

                        {/* Base Image */}
                        {scene.backgroundUrl && (
                            <URLImage
                                src={scene.backgroundUrl}
                                x={0} y={0}
                                width={1080} height={1080}
                                listening={false}
                            />
                        )}

                        {/* Objects */}
                        {scene.objects.map((obj) => {
                            // ... (Object rendering logic, same as before but ensure interactivity)
                            if (obj.type === 'text') {
                                return (
                                    <KonvaText
                                        key={obj.id}
                                        id={obj.id}
                                        draggable
                                        onClick={() => setSelectedId(obj.id)}
                                        onTap={() => setSelectedId(obj.id)}
                                        onDragEnd={(e) => handleObjectDragEnd(e, obj.id)}
                                        onTransformEnd={(e) => handleTransformEnd(e, obj.id)}
                                        x={obj.pose.x}
                                        y={obj.pose.y}
                                        rotation={obj.pose.r}
                                        scaleX={obj.pose.scaleX}
                                        scaleY={obj.pose.scaleY}
                                        text={obj.content}
                                        fontSize={obj.style?.fontSize || 40}
                                        fill={obj.style?.fill || 'black'}
                                        fontFamily={obj.style?.fontFamily || 'Inter'}
                                        opacity={obj.style?.opacity ?? 1}
                                        align={obj.style?.align || 'left'}
                                        fontStyle={obj.style?.fontStyle || 'normal'}
                                        textDecoration={obj.style?.textDecoration || ''}
                                        onDragMove={handleObjectDragMove}
                                    />
                                );
                            }
                            if (obj.type === 'image' || obj.type === 'tool') {
                                return (
                                    <URLImage
                                        key={obj.id}
                                        id={obj.id}
                                        draggable
                                        onClick={() => setSelectedId(obj.id)}
                                        onTap={() => setSelectedId(obj.id)}
                                        onDragEnd={(e: any) => handleObjectDragEnd(e, obj.id)}
                                        onTransformEnd={(e: any) => handleTransformEnd(e, obj.id)}
                                        x={obj.pose.x}
                                        y={obj.pose.y}
                                        rotation={obj.pose.r}
                                        scaleX={obj.pose.scaleX}
                                        scaleY={obj.pose.scaleY}
                                        src={obj.content}
                                        width={obj.style?.width || 100}
                                        height={obj.style?.height || 100}
                                        opacity={obj.style?.opacity ?? 1}
                                        onDragMove={handleObjectDragMove}
                                    />
                                );
                            }
                            if (obj.type === 'shape') {
                                const commonProps = {
                                    key: obj.id,
                                    id: obj.id,
                                    draggable: true,
                                    onClick: () => setSelectedId(obj.id),
                                    onTap: () => setSelectedId(obj.id),
                                    onDragEnd: (e: any) => handleObjectDragEnd(e, obj.id),
                                    onTransformEnd: (e: any) => handleTransformEnd(e, obj.id),
                                    onDragMove: handleObjectDragMove,
                                    x: obj.pose.x,
                                    y: obj.pose.y,
                                    rotation: obj.pose.r,
                                    scaleX: obj.pose.scaleX,
                                    scaleY: obj.pose.scaleY,
                                    fill: obj.style?.fill || '#3b82f6',
                                    stroke: obj.style?.stroke || 'transparent',
                                    strokeWidth: obj.style?.strokeWidth || 0,
                                    opacity: obj.style?.opacity ?? 1,
                                };

                                if (obj.content === 'rect') {
                                    return <KonvaRect {...commonProps} width={obj.style?.width || 100} height={obj.style?.height || 100} />;
                                }
                                if (obj.content === 'circle') {
                                    // Konva Circle radius is half of width usually
                                    return <KonvaCircle {...commonProps} radius={obj.style?.radius || 50} />;
                                }
                                if (obj.content === 'triangle') {
                                    return <KonvaRegularPolygon {...commonProps} sides={3} radius={obj.style?.radius || 60} />;
                                }
                                if (obj.content === 'star') {
                                    // Star needs inner/outer radius
                                    return <KonvaStar {...commonProps} numPoints={5} innerRadius={30} outerRadius={60} />;
                                }
                            }
                            return null;
                        })}

                        <Transformer ref={trRef}
                            borderStroke="#3b82f6"
                            anchorStroke="#3b82f6"
                            anchorFill="white"
                            anchorSize={10}
                        />
                    </Layer>

                    <Layer listening={false}>
                        {/* Guides */}
                        {guides.map((g, i) => (
                            <KonvaLine
                                key={i}
                                points={g.type === 'vertical' ? [g.position, -1000, g.position, 2000] : [-1000, g.position, 2000, g.position]}
                                stroke="#ff00ff"
                                strokeWidth={1 / zoom}
                                dash={[4 / zoom, 4 / zoom]}
                                listening={false}
                            />
                        ))}

                        {/* Safe Area */}
                        {safeAreaVisible && (
                            <KonvaRect
                                x={100} y={200} width={880} height={680}
                                stroke="#06b6d4" strokeWidth={2 / zoom} dash={[10, 10]}
                                listening={false}
                            />
                        )}
                    </Layer>
                </Stage>
            </div>
        </div>

        {/* Right Panel REMOVED */}

    </div >
);
}
