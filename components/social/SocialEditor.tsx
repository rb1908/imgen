'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Undo, Redo, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Line as KonvaLine, Rect as KonvaRect, Circle as KonvaCircle, RegularPolygon as KonvaRegularPolygon, Star as KonvaStar } from 'react-konva';
import useImage from 'use-image';
import { useCanvasStore } from '@/lib/canvas/store';
import { SocialEditorTools } from './SocialEditorTools';
import { SocialEditorToolbar } from './SocialEditorToolbar';
import { ShapesPanel } from './ShapesPanel';
import { TextPresetsPanel } from './TextPresetsPanel';
import { LayersPanel } from './LayersPanel';
import { getSnapGuides, GuideLine } from '@/lib/canvas/snapping';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialEditorProps {
    baseImage?: string;
    onSave?: (dataUrl: string) => void;
    isSaving?: boolean;
}

// Helper: URL Image Component for Konva
const URLImage = ({ src, x, y, width, height, ...props }: any) => {
    const [image] = useImage(src, 'anonymous'); // Check CORS
    return <KonvaImage image={image} x={x} y={y} width={width} height={height} {...props} />;
};

export function SocialEditor({ baseImage, onSave, isSaving }: SocialEditorProps) {
    const {
        scene,
        initScene,
        dispatch,
        undo,
        redo,
        historyPast,
        historyFuture,
        selectedId,
        setSelectedId,
        safeAreaVisible,
        snapEnabled,
        zoom, setZoom,
        pan, setPan
    } = useCanvasStore();

    const stageRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    // Local Interaction State
    const [panningMode, setPanningMode] = useState(false);

    // Tools State
    const [activeTool, setActiveTool] = useState<string | null>(null);

    // Snapping State
    const [guides, setGuides] = useState<GuideLine[]>([]);

    const handleObjectDragMove = (e: any) => {
        if (!snapEnabled) return;

        const node = e.target;
        const { snapX, snapY, guides: newGuides } = getSnapGuides(
            { x: node.x(), y: node.y(), width: 0, height: 0, rotation: 0 },
            [], // Pass empty array for now
            1080,
            1080
        );

        if (snapX !== null) node.x(snapX);
        if (snapY !== null) node.y(snapY);

        setGuides(newGuides);
    };

    // Initialize Scene
    useEffect(() => {
        if (baseImage) {
            initScene(1080, 1080, baseImage);
            setPan({ x: 50, y: 50 });
            setZoom(0.4);
        }
    }, [baseImage]);

    // Transformer
    useEffect(() => {
        if (selectedId && trRef.current && stageRef.current) {
            const node = stageRef.current.findOne('#' + selectedId);
            if (node) {
                trRef.current.nodes([node]);
                trRef.current.getLayer().batchDraw();
            }
        } else {
            if (trRef.current) trRef.current.nodes([]);
        }
    }, [selectedId, scene.objects]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selectedId) {
                    dispatch({ type: 'DELETE_ENTITY', id: selectedId });
                    setSelectedId(null);
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            }
            if (e.code === 'Space' && !panningMode) {
                setPanningMode(true);
            }
            if (selectedId) {
                const step = e.shiftKey ? 10 : 1;
                if (e.key === 'ArrowUp') { e.preventDefault(); dispatch({ type: 'MOVE_OBJECT', id: selectedId, dx: 0, dy: -step }); }
                if (e.key === 'ArrowDown') { e.preventDefault(); dispatch({ type: 'MOVE_OBJECT', id: selectedId, dx: 0, dy: step }); }
                if (e.key === 'ArrowLeft') { e.preventDefault(); dispatch({ type: 'MOVE_OBJECT', id: selectedId, dx: -step, dy: 0 }); }
                if (e.key === 'ArrowRight') { e.preventDefault(); dispatch({ type: 'MOVE_OBJECT', id: selectedId, dx: step, dy: 0 }); }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') setPanningMode(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedId, panningMode]);

    // Wheel Zoom
    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        if (e.evt.ctrlKey || e.evt.metaKey) {
            const scaleBy = 1.1;
            const stage = e.target.getStage();
            const oldScale = stage.scaleX();
            const mousePointTo = {
                x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
                y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
            };

            const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            const clampedScale = Math.max(0.05, Math.min(newScale, 5));

            setZoom(clampedScale);

            const newPos = {
                x: -(mousePointTo.x - stage.getPointerPosition().x / clampedScale) * clampedScale,
                y: -(mousePointTo.y - stage.getPointerPosition().y / clampedScale) * clampedScale,
            };
            setPan(newPos);
        } else {
            setPan({
                x: pan.x - e.evt.deltaX,
                y: pan.y - e.evt.deltaY
            });
        }
    };

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

    const handleStageDragEnd = (e: any) => {
        setPan({
            x: e.target.x(),
            y: e.target.y()
        });
    };

    const handleObjectDragEnd = (e: any, id: string) => {
        dispatch({
            type: 'SET_POSE',
            id,
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    const handleTransformEnd = (e: any, id: string) => {
        const node = e.target;
        dispatch({
            type: 'SET_POSE',
            id,
            x: node.x(),
            y: node.y(),
            r: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
        });
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-neutral-50 text-neutral-900">

            {/* Left Toolbar - Light */}
            <div className="border-r border-neutral-200 bg-white z-30">
                <SocialEditorTools activeTool={activeTool} onToolSelect={setActiveTool} />
            </div>

            {/* Side Panel (Contextual) - Light */}
            <AnimatePresence>
                {activeTool === 'layers' && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="border-r border-neutral-200 bg-white overflow-hidden z-20 shadow-xl"
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
                        className="border-r border-neutral-200 bg-white overflow-hidden z-20 shadow-xl"
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
                        className="border-r border-neutral-200 bg-white overflow-hidden z-20 shadow-xl"
                    >
                        <div className="w-[280px] h-full">
                            <TextPresetsPanel />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Middle: Canvas Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col bg-neutral-50">

                {/* Top Bar Actions */}
                <div className="h-14 border-b border-neutral-200 bg-white flex items-center justify-between px-4 z-20 shadow-sm">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900" onClick={undo} disabled={historyPast.length === 0}>
                            <Undo className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900" onClick={redo} disabled={historyFuture.length === 0}>
                            <Redo className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="font-mono text-xs text-neutral-500 flex items-center gap-4">
                        <span>{scene.width} x {scene.height}</span>
                        <span>{Math.round(zoom * 100)}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="text-neutral-500 hover:text-neutral-900" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-neutral-500 hover:text-neutral-900" onClick={() => setZoom(Math.min(5, zoom + 0.1))}>
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-4 bg-neutral-200 mx-2" />
                        <Button size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800" onClick={handleSave} disabled={isSaving}>
                            <Check className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>

                {/* Property Toolbar (Dynamic) */}
                <SocialEditorToolbar />

                {/* Infinite Canvas */}
                <div className="flex-1 relative cursor-dots bg-neutral-100" style={{ cursor: panningMode ? 'grab' : 'default' }}>
                    <Stage
                        width={window.innerWidth - 380}
                        height={window.innerHeight - 120}
                        scaleX={zoom}
                        scaleY={zoom}
                        x={pan.x}
                        y={pan.y}
                        draggable={panningMode}
                        onWheel={handleWheel}
                        onDragEnd={handleStageDragEnd}
                        ref={stageRef}
                        onMouseDown={(e) => {
                            if (e.target === e.target.getStage()) {
                                setSelectedId(null);
                            }
                        }}
                    >
                        <Layer>
                            <KonvaRect
                                x={0} y={0}
                                width={1080} height={1080}
                                fill="white"
                                shadowColor="black"
                                shadowBlur={20}
                                shadowOpacity={0.1}
                            />

                            {scene.backgroundUrl && (
                                <URLImage
                                    src={scene.backgroundUrl}
                                    x={0} y={0}
                                    width={1080} height={1080}
                                    listening={false}
                                />
                            )}

                            {/* Objects mapping remains same */}
                            {scene.objects.map((obj) => {
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
                                            {...obj.pose}
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
                                            {...obj.pose}
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
                                        ...obj.pose,
                                        fill: obj.style?.fill || '#3b82f6',
                                        stroke: obj.style?.stroke || 'transparent',
                                        strokeWidth: obj.style?.strokeWidth || 0,
                                        opacity: obj.style?.opacity ?? 1,
                                    };

                                    if (obj.content === 'rect') return <KonvaRect {...commonProps} width={obj.style?.width || 100} height={obj.style?.height || 100} />;
                                    if (obj.content === 'circle') return <KonvaCircle {...commonProps} radius={obj.style?.radius || 50} />;
                                    if (obj.content === 'triangle') return <KonvaRegularPolygon {...commonProps} sides={3} radius={obj.style?.radius || 60} />;
                                    if (obj.content === 'star') return <KonvaStar {...commonProps} numPoints={5} innerRadius={30} outerRadius={60} />;
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
                            {guides.map((g, i) => (
                                <KonvaLine
                                    key={i}
                                    points={g.type === 'vertical' ? [g.position, -1000, g.position, 2000] : [-1000, g.position, 2000, g.position]}
                                    stroke="#ec4899"
                                    strokeWidth={1 / zoom}
                                    dash={[4 / zoom, 4 / zoom]}
                                    listening={false}
                                />
                            ))}

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

        </div >
    );
}
