'use client';

import { Button } from '@/components/ui/button';
import { MousePointer2, Type, Image as ImageIcon, LayoutTemplate, Grid3X3, Smartphone, Shapes } from 'lucide-react';
import { useCanvasStore } from '@/lib/canvas/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SocialEditorToolsProps {
    activeTool: string | null;
    onToolSelect: (tool: string | null) => void;
}

export function SocialEditorTools({ activeTool, onToolSelect }: SocialEditorToolsProps) {
    const { dispatch, safeAreaVisible, setSafeAreaVisible, snapEnabled, setSnapEnabled } = useCanvasStore();



    return (
        <TooltipProvider>
            <div className="w-16 border-r border-neutral-800 bg-neutral-900 flex flex-col items-center py-4 gap-4 z-10 h-full">

                <ToolButton
                    icon={<MousePointer2 />}
                    label="Select"
                    active={activeTool === null}
                    onClick={() => onToolSelect(null)}
                />

                <ToolButton
                    icon={<Type />}
                    label="Text"
                    active={activeTool === 'text'}
                    onClick={() => onToolSelect(activeTool === 'text' ? null : 'text')}
                />

                <ToolButton
                    icon={<ImageIcon />}
                    label="Images"
                    active={activeTool === 'images'}
                    onClick={() => onToolSelect(activeTool === 'images' ? null : 'images')}
                />

                <ToolButton
                    icon={<LayoutTemplate />}
                    label="Layers"
                    active={activeTool === 'layers'}
                    onClick={() => onToolSelect(activeTool === 'layers' ? null : 'layers')}
                />

                <ToolButton
                    icon={<Shapes />}
                    label="Shapes"
                    active={activeTool === 'shapes'}
                    onClick={() => onToolSelect(activeTool === 'shapes' ? null : 'shapes')}
                />

                <div className="h-px w-8 bg-border my-2" />

                <ToolButton
                    icon={<Grid3X3 />}
                    label="Snap Guides"
                    active={snapEnabled}
                    onClick={() => setSnapEnabled(!snapEnabled)}
                />

                <ToolButton
                    icon={<Smartphone />}
                    label="Safe Area"
                    active={safeAreaVisible}
                    onClick={() => setSafeAreaVisible(!safeAreaVisible)}
                />

            </div>
        </TooltipProvider>
    );
}

function ToolButton({ icon, label, onClick, active }: any) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant={active ? "default" : "ghost"}
                    size="icon"
                    onClick={onClick}
                    className={active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}
                >
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
}
