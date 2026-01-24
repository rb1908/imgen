import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Line as KonvaLine, Rect as KonvaRect, Circle as KonvaCircle, RegularPolygon as KonvaRegularPolygon, Star as KonvaStar } from 'react-konva';
import useImage from 'use-image';
import { GuideLine } from '@/lib/engine/snapping';

// Helper: URL Image Component for Konva
const URLImage = ({ src, x, y, width, height, ...props }: any) => {
    const [image] = useImage(src, 'anonymous'); // Check CORS
    return <KonvaImage image={image} x={x} y={y} width={width} height={height} {...props} />;
};

interface SocialCanvasProps {
    stageRef: any;
    trRef: any;
    scene: any;
    zoom: number;
    pan: { x: number, y: number };
    panningMode: boolean;
    activeTool: string | null;
    handlers: {
        handleWheel: (e: any) => void;
        handleStageDragEnd: (e: any) => void;
        handleObjectDragMove: (e: any) => void;
        handleObjectDragEnd: (e: any, id: string) => void;
        handleTransformEnd: (e: any, id: string) => void;
        setSelectedId: (id: string | null) => void;
        setActiveTool: (tool: string | null) => void;
    };
    guides: GuideLine[];
    safeAreaVisible: boolean;
}

export function SocialCanvas({
    stageRef, trRef,
    scene, zoom, pan, panningMode, activeTool,
    handlers, guides, safeAreaVisible
}: SocialCanvasProps) {

    return (
        <div className="flex-1 relative cursor-dots bg-neutral-950/50" style={{ cursor: panningMode ? 'grab' : 'default' }}>
            <Stage
                width={window.innerWidth - 64 - (activeTool ? 280 : 0)}
                height={window.innerHeight - 120}
                scaleX={zoom}
                scaleY={zoom}
                x={pan.x}
                y={pan.y}
                draggable={panningMode}
                onWheel={handlers.handleWheel}
                onDragEnd={handlers.handleStageDragEnd}
                ref={stageRef}
                onMouseDown={(e) => {
                    const isBackground = e.target === e.target.getStage() || e.target.name() === 'bg-layer';
                    if (isBackground) {
                        handlers.setSelectedId(null);
                        handlers.setActiveTool(null);
                    }
                }}
            >
                <Layer>
                    <KonvaRect
                        name="bg-layer"
                        x={0} y={0}
                        width={1080} height={1080}
                        fill="white"
                        shadowColor="black"
                        shadowBlur={50}
                        shadowOpacity={0.5}
                    />

                    {scene.backgroundUrl && (
                        <URLImage
                            src={scene.backgroundUrl}
                            x={0} y={0}
                            width={1080} height={1080}
                            listening={false}
                        />
                    )}

                    {scene.objects.map((obj: any) => {
                        if (obj.type === 'text') {
                            return (
                                <KonvaText
                                    key={obj.id}
                                    id={obj.id}
                                    draggable
                                    onClick={() => handlers.setSelectedId(obj.id)}
                                    onTap={() => handlers.setSelectedId(obj.id)}
                                    onDragEnd={(e) => handlers.handleObjectDragEnd(e, obj.id)}
                                    onTransformEnd={(e) => handlers.handleTransformEnd(e, obj.id)}
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
                                    onDragMove={handlers.handleObjectDragMove}
                                />
                            );
                        }
                        if (obj.type === 'image' || obj.type === 'tool') {
                            return (
                                <URLImage
                                    key={obj.id}
                                    id={obj.id}
                                    draggable
                                    onClick={() => handlers.setSelectedId(obj.id)}
                                    onTap={() => handlers.setSelectedId(obj.id)}
                                    onDragEnd={(e: any) => handlers.handleObjectDragEnd(e, obj.id)}
                                    onTransformEnd={(e: any) => handlers.handleTransformEnd(e, obj.id)}
                                    x={obj.pose.x}
                                    y={obj.pose.y}
                                    rotation={obj.pose.r}
                                    scaleX={obj.pose.scaleX}
                                    scaleY={obj.pose.scaleY}
                                    src={obj.content}
                                    width={obj.style?.width || 100}
                                    height={obj.style?.height || 100}
                                    opacity={obj.style?.opacity ?? 1}
                                    onDragMove={handlers.handleObjectDragMove}
                                />
                            );
                        }
                        if (obj.type === 'shape') {
                            const commonProps = {
                                key: obj.id,
                                id: obj.id,
                                draggable: true,
                                onClick: () => handlers.setSelectedId(obj.id),
                                onTap: () => handlers.setSelectedId(obj.id),
                                onDragEnd: (e: any) => handlers.handleObjectDragEnd(e, obj.id),
                                onTransformEnd: (e: any) => handlers.handleTransformEnd(e, obj.id),
                                onDragMove: handlers.handleObjectDragMove,
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
                                return <KonvaCircle {...commonProps} radius={obj.style?.radius || 50} />;
                            }
                            if (obj.content === 'triangle') {
                                return <KonvaRegularPolygon {...commonProps} sides={3} radius={obj.style?.radius || 60} />;
                            }
                            if (obj.content === 'star') {
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
    );
}
