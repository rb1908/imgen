import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '@/lib/canvas/store';
import { getSnapGuides, GuideLine } from '@/lib/canvas/snapping';

export function useSocialEditor(baseImage?: string) {
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
    const trRef = useRef<any>(null); // Transformer Ref

    // Local Interaction State
    const [panningMode, setPanningMode] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [guides, setGuides] = useState<GuideLine[]>([]);

    // Initialize Scene
    useEffect(() => {
        if (baseImage) {
            initScene(1080, 1080, baseImage);
            setPan({ x: 50, y: 50 });
            setZoom(0.4);
        }
    }, [baseImage]);

    // Transformer Sync
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

    // Snapping Logic
    const handleObjectDragMove = (e: any) => {
        if (!snapEnabled) return;
        const node = e.target;
        const { snapX, snapY, guides: newGuides } = getSnapGuides(
            { x: node.x(), y: node.y(), width: 0, height: 0, rotation: 0 },
            [],
            1080,
            1080
        );
        if (snapX !== null) node.x(snapX);
        if (snapY !== null) node.y(snapY);
        setGuides(newGuides);
    };

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

    // Canvas Events
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
            setPan({ x: pan.x - e.evt.deltaX, y: pan.y - e.evt.deltaY });
        }
    };

    const handleStageDragEnd = (e: any) => {
        setPan({ x: e.target.x(), y: e.target.y() });
    };

    const handleObjectDragEnd = (e: any, id: string) => {
        dispatch({ type: 'SET_POSE', id, x: e.target.x(), y: e.target.y() });
    };

    const handleTransformEnd = (e: any, id: string) => {
        const node = e.target;
        dispatch({
            type: 'SET_POSE', id,
            x: node.x(), y: node.y(), r: node.rotation(),
            scaleX: node.scaleX(), scaleY: node.scaleY(),
        });
    };

    return {
        // State
        scene, selectedId, setSelectedId,
        zoom, setZoom, pan, setPan,
        activeTool, setActiveTool,
        panningMode, guides,
        safeAreaVisible, snapEnabled, // Exposed for Canvas
        historyPast, historyFuture, undo, redo,
        dispatch,

        // Refs
        stageRef, trRef,

        // Handlers
        handleWheel,
        handleStageDragEnd,
        handleObjectDragMove,
        handleObjectDragEnd,
        handleTransformEnd,
    };
}
