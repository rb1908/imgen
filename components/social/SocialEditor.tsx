'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Undo, Redo, Check } from 'lucide-react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Rect as KonvaRect } from 'react-konva';
import useImage from 'use-image';
import { useCanvasStore } from '@/lib/canvas/store';
import { SocialEditorTools } from './SocialEditorTools';
import { SocialEditorProperties } from './SocialEditorProperties';
import { createToolObject } from '@/lib/canvas/toolRegistry';

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
        snapEnabled
    } = useCanvasStore();

    const stageRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    // Initialize Scene on Mount if baseImage provided
    useEffect(() => {
        if (baseImage) {
            initScene(1080, 1080, baseImage);
        }
    }, [baseImage]);

    // Transformer Logic
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

    const handleSave = () => {
        if (stageRef.current && onSave) {
            // Unselect before saving
            setSelectedId(null);
            setTimeout(() => {
                const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
                onSave(dataUrl);
            }, 50);
        }
    };

    const handleDragEnd = (e: any, id: string) => {
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

    // Snap Logic (Simple Center Snap)
    const handleDragMove = (e: any) => {
        if (!snapEnabled) return;

        const node = e.target;
        const stage = node.getStage();
        const stageWidth = stage.width();
        const stageHeight = stage.height();

        // Snap to center
        const threshold = 10;
        if (Math.abs(node.x() - stageWidth / 2) < threshold) {
            node.x(stageWidth / 2);
            // Ideally draw guide lines here
        }
        if (Math.abs(node.y() - stageHeight / 2) < threshold) {
            node.y(stageHeight / 2);
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">

            {/* Left Toolbar */}
            <SocialEditorTools />

            {/* Middle: Canvas Area */}
            <div className="flex-1 bg-muted/50 relative overflow-hidden flex flex-col">
                {/* Top Bar Actions */}
                <div className="h-14 border-b bg-background flex items-center justify-between px-4 z-20 shadow-sm">

                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={undo} disabled={historyPast.length === 0}>
                            <Undo className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={redo} disabled={historyFuture.length === 0}>
                            <Redo className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="font-semibold text-sm text-muted-foreground">
                        {scene.width} x {scene.height}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            <Check className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>

                {/* Canvas Stage Wrapper */}
                <div className="flex-1 flex items-center justify-center p-8 bg-neutral-100 overflow-auto">
                    <div className="shadow-2xl bg-white relative">
                        <Stage
                            width={500} // This assumes fixed preview size, ideally responsive
                            height={500}
                            ref={stageRef}
                            onMouseDown={(e) => {
                                // Deselect if clicked on empty stage
                                if (e.target === e.target.getStage()) {
                                    setSelectedId(null);
                                }
                            }}
                        >
                            <Layer>
                                {/* Base Image */}
                                {scene.backgroundUrl && (
                                    <URLImage
                                        src={scene.backgroundUrl}
                                        x={0} y={0}
                                        width={500} height={500}
                                        listening={false}
                                    />
                                )}

                                {/* Objects */}
                                {scene.objects.map((obj) => {
                                    if (obj.type === 'text') {
                                        return (
                                            <KonvaText
                                                key={obj.id}
                                                id={obj.id}
                                                draggable
                                                onClick={() => setSelectedId(obj.id)}
                                                onTap={() => setSelectedId(obj.id)}
                                                onDragEnd={(e) => handleDragEnd(e, obj.id)}
                                                onDragMove={handleDragMove}
                                                onTransformEnd={(e) => handleTransformEnd(e, obj.id)}
                                                x={obj.pose.x}
                                                y={obj.pose.y}
                                                rotation={obj.pose.r}
                                                scaleX={obj.pose.scaleX}
                                                scaleY={obj.pose.scaleY}
                                                text={obj.content}
                                                // Dynamic Style
                                                fontSize={obj.style?.fontSize || 40}
                                                fill={obj.style?.fill || 'white'}
                                                stroke={obj.style?.stroke || 'black'}
                                                fontFamily={obj.style?.fontFamily || 'Inter'}
                                                opacity={obj.style?.opacity ?? 1}
                                                strokeWidth={1}
                                            />
                                        );
                                    }
                                    if (obj.type === 'tool' || obj.type === 'image') {
                                        return (
                                            <URLImage
                                                key={obj.id}
                                                id={obj.id}
                                                draggable
                                                onClick={() => setSelectedId(obj.id)}
                                                onTap={() => setSelectedId(obj.id)}
                                                onDragEnd={(e: any) => handleDragEnd(e, obj.id)}
                                                onDragMove={handleDragMove}
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
                                            />
                                        );
                                    }
                                    return null;
                                })}

                                {/* Transformer */}
                                <Transformer ref={trRef} />
                            </Layer>

                            {/* Safe Area Overlay Layer */}
                            {safeAreaVisible && (
                                <Layer listening={false}>
                                    <KonvaRect
                                        x={50} y={50} width={400} height={400}
                                        stroke="cyan"
                                        strokeWidth={2}
                                        dash={[10, 5]}
                                    />
                                    <KonvaText x={215} y={20} text="Safe Zone" fill="cyan" />
                                </Layer>
                            )}
                        </Stage>
                    </div>
                </div>
            </div>

            {/* Right Panel: Properties or AI */}
            <SocialEditorProperties />

        </div>
    );
}
