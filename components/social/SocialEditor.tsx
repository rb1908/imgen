'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Undo, Redo, Check } from 'lucide-react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';
import useImage from 'use-image';
import { useCanvasStore } from '@/lib/canvas/store';
import { AICopilotPanel } from './AICopilotPanel';

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
        setSelectedId
    } = useCanvasStore();

    const stageRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    // Initialize Scene on Mount if baseImage provided
    useEffect(() => {
        if (baseImage) {
            initScene(1080, 1080, baseImage);
        }
    }, [baseImage]); // Run only when baseImage changes (or init)

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

    return (
        <div className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-background">

            {/* 1. Canvas Area */}
            <div className="flex-1 bg-muted/50 relative overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="h-12 border-b bg-background flex items-center justify-between px-4">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={undo} disabled={historyPast.length === 0}>
                            <Undo className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={redo} disabled={historyFuture.length === 0}>
                            <Redo className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            <Check className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>

                {/* Canvas Stage */}
                <div className="flex-1 flex items-center justify-center p-8 bg-neutral-100 overflow-auto">
                    <div className="shadow-2xl bg-white relative">
                        <Stage
                            width={500}
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
                                                onTransformEnd={(e) => handleTransformEnd(e, obj.id)}
                                                x={obj.pose.x}
                                                y={obj.pose.y}
                                                rotation={obj.pose.r}
                                                scaleX={obj.pose.scaleX}
                                                scaleY={obj.pose.scaleY}
                                                text={obj.content}
                                                fontSize={24}
                                                fill="white" // Simplify
                                                stroke="black"
                                                strokeWidth={1}
                                                fontFamily="Inter"
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
                                                onTransformEnd={(e: any) => handleTransformEnd(e, obj.id)}
                                                x={obj.pose.x}
                                                y={obj.pose.y}
                                                rotation={obj.pose.r}
                                                scaleX={obj.pose.scaleX}
                                                scaleY={obj.pose.scaleY}
                                                src={obj.content}
                                                width={100} // Default
                                                height={100}
                                            />
                                        );
                                    }
                                    return null;
                                })}

                                {/* Interaction Transformer */}
                                <Transformer ref={trRef} />
                            </Layer>
                        </Stage>
                    </div>
                </div>
            </div>

            {/* 2. AI Copilot Panel */}
            <AICopilotPanel />

        </div>
    );
}
