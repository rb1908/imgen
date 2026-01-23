'use client';

import { Button } from '@/components/ui/button';
import { MousePointer2, Type, Image as ImageIcon, LayoutTemplate, Grid3X3, Smartphone } from 'lucide-react';
import { useCanvasStore } from '@/lib/canvas/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SocialEditorToolsProps {
    activeTool: string | null;
    onToolSelect: (tool: string | null) => void;
}

export function SocialEditorTools({ activeTool, onToolSelect }: SocialEditorToolsProps) {
    const { dispatch, safeAreaVisible, setSafeAreaVisible, snapEnabled, setSnapEnabled } = useCanvasStore();

    const handleAddText = () => {
        dispatch({
            type: 'ADD_TEXT',
            content: 'Double Tap to Edit',
            x: 540,
            y: 540,
            style: 'modern'
        });
    };

    const handleAddImage = () => {
        document.getElementById('editor-image-upload')?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            dispatch({
                type: 'ADD_IMAGE',
                url,
                x: 540,
                y: 540
            } as any);
        }
    };

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
                    label="Add Text"
                    onClick={handleAddText}
                />

                <div className="relative">
                    <ToolButton icon={<ImageIcon />} label="Add Image" onClick={handleAddImage} />
                    <input
                        id="editor-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                <ToolButton
                    icon={<LayoutTemplate />}
                    label="Layers"
                    active={activeTool === 'layers'}
                    onClick={() => onToolSelect(activeTool === 'layers' ? null : 'layers')}
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
