'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useCanvasStore } from '@/lib/canvas/store';
import { CanvasCommand } from '@/lib/canvas/commands';
import { Sparkles, Play, SkipForward, X, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

// MOCK AI GENERATOR (Replace with real server action later)
async function mockGenerateCommands(goal: string, scene: any): Promise<CanvasCommand[]> {
    await new Promise(r => setTimeout(r, 1000)); // Simulate latency

    const goalLower = goal.toLowerCase();
    const commands: CanvasCommand[] = [];

    if (goalLower.includes('knife')) {
        commands.push({ type: 'ADD_TOOL', toolType: 'tool.knife', x: 200, y: 200 });
    }

    if (goalLower.includes('move')) {
        // Find first object
        if (scene.objects.length > 0) {
            commands.push({ type: 'MOVE_OBJECT', id: scene.objects[0].id, dx: 50, dy: 50 });
        } else {
            throw new Error("No objects to move!");
        }
    }

    if (goalLower.includes('rotate')) {
        if (scene.objects.length > 0) {
            // 45 deg rotation
            commands.push({ type: 'UPDATE_OBJECT', id: scene.objects[0].id, patch: { pose: { ...scene.objects[0].pose, r: 45 } } });
        }
    }

    if (goalLower.includes('delete')) {
        if (scene.selectedId) {
            commands.push({ type: 'DELETE_ENTITY', id: scene.selectedId });
        } else if (scene.objects.length > 0) {
            commands.push({ type: 'DELETE_ENTITY', id: scene.objects[scene.objects.length - 1].id });
        }
    }

    if (commands.length === 0) {
        // Fallback demo
        commands.push({ type: 'ADD_TOOL', toolType: 'tool.brush', x: 500, y: 500 });
    }

    return commands;
}

export function AICopilotPanel() {
    const { scene, dispatch } = useCanvasStore();
    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [proposedCommands, setProposedCommands] = useState<CanvasCommand[] | null>(null);

    const handleGenerate = async () => {
        if (!goal) return;
        setIsGenerating(true);
        setProposedCommands(null);

        try {
            const cmds = await mockGenerateCommands(goal, scene);
            setProposedCommands(cmds);
            // toast.success(`AI proposed ${cmds.length} actions`);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        if (proposedCommands) {
            dispatch(proposedCommands, 'ai');
            setProposedCommands(null);
            setGoal('');
            toast.success("AI actions applied");
        }
    };

    const handleReject = () => {
        setProposedCommands(null);
    };

    return (
        <div className="flex flex-col h-full bg-background border-l w-80">
            <div className="p-4 border-b bg-muted/20">
                <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI Copilot
                </h3>
                <p className="text-xs text-muted-foreground">Describe your goal (e.g. "add a knife")</p>
            </div>

            <ScrollArea className="flex-1 p-4">
                {/* Chat / Input Area */}
                <div className="space-y-4">
                    <Textarea
                        placeholder="What should I do?"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="min-h-[80px]"
                    />

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !goal}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    >
                        {isGenerating ? "Thinking..." : "Generate Commands"}
                    </Button>
                </div>

                {/* Proposals Area */}
                {proposedCommands && (
                    <div className="mt-6 space-y-3 animate-in slide-in-from-bottom-2 fade-in">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
                            <span>Proposed Changes</span>
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {proposedCommands.length} Steps
                            </span>
                        </div>

                        <Card className="p-3 bg-muted/50 text-xs font-mono space-y-2 border-l-4 border-l-purple-500">
                            {proposedCommands.map((cmd, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-muted-foreground">{i + 1}.</span>
                                    <span>{cmd.type}</span>
                                    {/* Simplified summary */}
                                    {(cmd.type === 'ADD_TOOL' || cmd.type === 'ADD_OBJECT') && <span className="text-muted-foreground">{(cmd as any).toolType || 'object'}</span>}
                                </div>
                            ))}
                        </Card>

                        <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" onClick={handleApply} className="w-full">
                                <Check className="w-4 h-4 mr-2" /> Apply
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleReject} className="w-full">
                                <X className="w-4 h-4 mr-2" /> Reject
                            </Button>
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
