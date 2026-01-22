import { create } from 'zustand';
import { CanvasCommand, applyCommands, applyCommand } from './commands';
import { Scene, createDefaultScene } from './sceneSchema';

interface ActionLogItem {
    id: string;
    timestamp: Date;
    actor: 'human' | 'ai';
    summary: string;
    status: 'success' | 'error';
    error?: string;
}

interface CanvasStore {
    scene: Scene;
    historyPast: Scene[];
    historyFuture: Scene[];
    actionLog: ActionLogItem[];

    // Actions
    initScene: (width: number, height: number, backgroundUrl?: string) => void;
    dispatch: (command: CanvasCommand | CanvasCommand[], actor?: 'human' | 'ai') => void;
    undo: () => void;
    redo: () => void;

    // Selection (UI State only)
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;

    // Editor UI State
    safeAreaVisible: boolean;
    setSafeAreaVisible: (visible: boolean) => void;
    snapEnabled: boolean;
    setSnapEnabled: (enabled: boolean) => void;

    // Viewport State
    zoom: number;
    setZoom: (zoom: number) => void;
    pan: { x: number, y: number };
    setPan: (pan: { x: number, y: number }) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
    scene: createDefaultScene(),
    historyPast: [],
    historyFuture: [],
    actionLog: [],
    selectedId: null,
    safeAreaVisible: false,
    snapEnabled: true,
    zoom: 1,
    pan: { x: 0, y: 0 },

    initScene: (width, height, backgroundUrl) => {
        set({
            scene: { ...createDefaultScene(width, height), backgroundUrl },
            historyPast: [],
            historyFuture: [],
            actionLog: []
        });
    },

    setSelectedId: (id) => set({ selectedId: id }),
    setSafeAreaVisible: (visible) => set({ safeAreaVisible: visible }),
    setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
    setZoom: (zoom) => set({ zoom }),
    setPan: (pan) => set({ pan }),

    dispatch: (input, actor = 'human') => {
        const state = get();
        const commands = Array.isArray(input) ? input : [input];

        try {
            const result = applyCommands(state.scene, commands);

            const newLog: ActionLogItem = {
                id: Math.random().toString(36),
                timestamp: new Date(),
                actor,
                summary: result.event || 'Unknown Action',
                status: 'success'
            };

            set({
                historyPast: [...state.historyPast, state.scene], // Push current to past
                scene: result.scene,
                historyFuture: [], // Clear redo stack on new action
                actionLog: [newLog, ...state.actionLog]
            });

        } catch (e: any) {
            console.error("Command Error:", e);
            const newLog: ActionLogItem = {
                id: Math.random().toString(36),
                timestamp: new Date(),
                actor,
                summary: 'Action Failed',
                status: 'error',
                error: e.message
            };
            set({ actionLog: [newLog, ...state.actionLog] });
            throw e; // Re-throw so UI can catch if needed
        }
    },

    undo: () => {
        const state = get();
        if (state.historyPast.length === 0) return;

        const previous = state.historyPast[state.historyPast.length - 1];
        const newPast = state.historyPast.slice(0, -1);

        set({
            scene: previous,
            historyPast: newPast,
            historyFuture: [state.scene, ...state.historyFuture]
        });
    },

    redo: () => {
        const state = get();
        if (state.historyFuture.length === 0) return;

        const next = state.historyFuture[0];
        const newFuture = state.historyFuture.slice(1);

        set({
            scene: next,
            historyPast: [...state.historyPast, state.scene],
            historyFuture: newFuture
        });
    }
}));
